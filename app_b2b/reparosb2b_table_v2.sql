-- ==========================================
-- TABELA reparosb2b - NOVA ESTRUTURA
-- Baseada na nova API BDS (2026-02-27)
-- ==========================================
-- Todos os campos são TEXT para evitar problemas de formatação,
-- exceto campos de data composta e flags que são INT
-- ==========================================

DROP TABLE IF EXISTS reparosb2b;

CREATE TABLE reparosb2b (
    -- ==========================================
    -- IDENTIFICAÇÃO PRINCIPAL
    -- ==========================================
    id INT AUTO_INCREMENT PRIMARY KEY,
    bd TEXT NOT NULL COMMENT 'Identificador único do BD (chave para evitar duplicação)',
    bd_raiz TEXT COMMENT 'BD raiz',
    protocolo_crm TEXT COMMENT 'Protocolo CRM',
    id_vantive TEXT COMMENT 'ID Vantive',
    id_circuito TEXT COMMENT 'ID do circuito',
    bd_ant TEXT COMMENT 'BD antigo',
    id_comercial TEXT COMMENT 'ID comercial',
    status_codigo TEXT COMMENT 'Código do status',
    
    -- ==========================================
    -- STATUS E TIPO
    -- ==========================================
    status_nome TEXT COMMENT 'Nome do status (STATUS na API)',
    tipo_ngem TEXT COMMENT 'Tipo NGEM',
    
    -- ==========================================
    -- PROCEDÊNCIA E RECLAMAÇÃO
    -- ==========================================
    procedencia TEXT COMMENT 'Procedência',
    reclamacao TEXT COMMENT 'Reclamação',
    
    -- ==========================================
    -- SEGMENTO
    -- ==========================================
    segmento_sistema TEXT COMMENT 'Segmento do sistema (SEGMENTO_SIGITM)',
    segmento_comercial TEXT COMMENT 'Segmento comercial (SEGMENTO_COMERCIAL)',
    segmento_novo TEXT COMMENT 'Segmento novo (SEGMENTO_COMERCIAL_NOVO)',
    segmento_v3 TEXT COMMENT 'Segmento V3',
    segmento_vivo_corp TEXT COMMENT 'Segmento Vivo Corp',
    atendimento_valor TEXT COMMENT 'Atendimento valor',
    slm_flag TEXT COMMENT 'Flag SLM',
    
    -- ==========================================
    -- CLIENTE
    -- ==========================================
    cliente_nome TEXT COMMENT 'Nome do cliente (CLIENTE na API)',
    cnpj TEXT COMMENT 'CNPJ',
    cnpj_raiz TEXT COMMENT 'CNPJ raiz',
    cod_grupo TEXT COMMENT 'Código do grupo',
    grupo_economico TEXT COMMENT 'Grupo econômico',
    
    -- ==========================================
    -- ENDEREÇO
    -- ==========================================
    endereco TEXT COMMENT 'Endereço (ENDERECO na API)',
    cidade TEXT COMMENT 'Cidade',
    uf TEXT COMMENT 'Unidade federativa',
    cluster TEXT COMMENT 'Cluster',
    localidade_codigo TEXT COMMENT 'Código da localidade (CNL)',
    area_codigo TEXT COMMENT 'Código da área (AREA)',
    escritorio_codigo TEXT COMMENT 'Código do escritório (ESCRITORIO)',
    regional TEXT COMMENT 'Regional',
    regional_vivo TEXT COMMENT 'Regional Vivo',
    
    -- ==========================================
    -- LP / CIRCUITO / SERVIÇO
    -- ==========================================
    lp_15 TEXT COMMENT 'LP 15',
    designador_lp_13 TEXT COMMENT 'Designador LP 13 (LP_13 na API)',
    lp_operadora TEXT COMMENT 'LP operadora',
    servico_cpcc_nome TEXT COMMENT 'Nome do serviço CPCC',
    cpcc TEXT COMMENT 'CPCC',
    velocidade TEXT COMMENT 'Velocidade',
    velocidade_kbps TEXT COMMENT 'Velocidade em Kbps',
    produto_nome TEXT COMMENT 'Nome do produto',
    servico TEXT COMMENT 'Serviço',
    familia_produto TEXT COMMENT 'Família do produto',
    
    -- ==========================================
    -- DATAS PRINCIPAIS
    -- ==========================================
    data_abertura TEXT COMMENT 'Data de abertura',
    data_abertura_dia_semana INT COMMENT 'Dia da semana da abertura',
    data_abertura_dia INT COMMENT 'Dia da abertura',
    data_abertura_mes INT COMMENT 'Mês da abertura',
    data_abertura_ano INT COMMENT 'Ano da abertura',
    mes_ano_abertura TEXT COMMENT 'Mês/ano da abertura',
    
    data_reparo TEXT COMMENT 'Data do reparo',
    data_reparo_dia_semana INT COMMENT 'Dia da semana do reparo',
    data_reparo_dia INT COMMENT 'Dia do reparo',
    data_reparo_mes INT COMMENT 'Mês do reparo',
    data_reparo_ano INT COMMENT 'Ano do reparo',
    
    data_encerramento TEXT COMMENT 'Data de encerramento',
    data_encerramento_dia_semana INT COMMENT 'Dia da semana do encerramento',
    data_encerramento_dia INT COMMENT 'Dia do encerramento',
    data_encerramento_mes INT COMMENT 'Mês do encerramento',
    data_encerramento_ano INT COMMENT 'Ano do encerramento',
    mes_ano_enc TEXT COMMENT 'Mês/ano do encerramento',
    
    data_baixa TEXT COMMENT 'Data de baixa',
    data_baixa_dia_semana INT COMMENT 'Dia da semana da baixa',
    data_baixa_dia INT COMMENT 'Dia da baixa',
    data_baixa_mes INT COMMENT 'Mês da baixa',
    data_baixa_ano INT COMMENT 'Ano da baixa',
    
    last_update TEXT COMMENT 'Última atualização',
    
    -- ==========================================
    -- BAIXA - CÓDIGOS E NOMES
    -- ==========================================
    baixa_n1_codigo TEXT COMMENT 'Código da baixa N1',
    baixa_n1_nome TEXT COMMENT 'Nome da baixa N1 (BAIXA_N1)',
    baixa_n2_codigo TEXT COMMENT 'Código da baixa N2',
    baixa_n2_nome TEXT COMMENT 'Nome da baixa N2 (BAIXA_N2)',
    baixa_n3_codigo TEXT COMMENT 'Código da baixa N3',
    baixa_n3_nome TEXT COMMENT 'Nome da baixa N3 (BAIXA_N3)',
    baixa_n4_codigo TEXT COMMENT 'Código da baixa N4',
    baixa_n4_nome TEXT COMMENT 'Nome da baixa N4 (BAIXA_N4)',
    baixa_n5_codigo TEXT COMMENT 'Código da baixa N5',
    baixa_n5_nome TEXT COMMENT 'Nome da baixa N5 (BAIXA_N5)',
    baixa_codigo TEXT COMMENT 'Código da baixa (BAIXA_CODIGO)',
    
    -- ==========================================
    -- INTRAGOV
    -- ==========================================
    resumo_intragov TEXT COMMENT 'Resumo intragov',
    intragov_sigla TEXT COMMENT 'Sigla intragov',
    intragov_codigo TEXT COMMENT 'Código intragov',
    flag_intragov INT COMMENT 'Flag intragov',
    
    -- ==========================================
    -- ACIONAMENTOS
    -- ==========================================
    acionamento_tecnico INT COMMENT 'Acionamento técnico',
    acionamento_operadora INT COMMENT 'Acionamento operadora',
    acionamento_integradora INT COMMENT 'Acionamento integradora',
    acionamento_parceiro INT COMMENT 'Acionamento parceiro',
    acionamento_transmissao INT COMMENT 'Acionamento transmissão',
    acionamento_ccr INT COMMENT 'Acionamento CCR',
    acionamento_osp INT COMMENT 'Acionamento OSP',
    acionamento_diag_b2b INT COMMENT 'Acionamento diag B2B',
    
    -- ==========================================
    -- SLA
    -- ==========================================
    sla_horas TEXT COMMENT 'SLA em horas',
    sla_tipo TEXT COMMENT 'Tipo de SLA',
    
    -- ==========================================
    -- GRUPO / FOCO
    -- ==========================================
    grupo TEXT COMMENT 'Grupo (GRUPO_MIS)',
    grupo_novo TEXT COMMENT 'Grupo novo (GRUPO_PER_B2B)',
    foco_acoes TEXT COMMENT 'Foco das ações (FOCO_MIS)',
    foco_novo TEXT COMMENT 'Foco novo (FOCO_PER_B2B)',
    grupo_abertura TEXT COMMENT 'Grupo de abertura',
    usuario_abertura TEXT COMMENT 'Usuário de abertura',
    grupo_baixa TEXT COMMENT 'Grupo de baixa',
    usuario_baixa TEXT COMMENT 'Usuário de baixa',
    grupo_responsavel TEXT COMMENT 'Grupo responsável',
    
    -- ==========================================
    -- OPERADORA
    -- ==========================================
    operadora TEXT COMMENT 'Operadora',
    tipo_operadora TEXT COMMENT 'Tipo de operadora',
    massiva_flag INT COMMENT 'Flag massiva',
    
    -- ==========================================
    -- TMR / TEMPOS
    -- ==========================================
    tmr TEXT COMMENT 'TMR (TMR_MIN na API)',
    tmr_sem_parada TEXT COMMENT 'TMR sem parada (decorrido_sem_parada)',
    tempo_parada TEXT COMMENT 'Tempo de parada (TEMPO_PARADA_MIN)',
    tmr_exp_reparo_min TEXT COMMENT 'TMR exp reparo (min)',
    tmr_exp_min TEXT COMMENT 'TMR exp (min)',
    prazo TEXT COMMENT 'Prazo',
    
    -- ==========================================
    -- REINCIDÊNCIA
    -- ==========================================
    reincidencia_30d INT COMMENT 'Reincidência 30 dias (REINC_30D)',
    reincidencia_30d_grupo INT COMMENT 'Reincidência 30D grupo (REINC_30D_GRUPO)',
    reincidencia_tipo TEXT COMMENT 'Tipo de reincidência (REINC_TIPO)',
    originou_reinc TEXT COMMENT 'Originou reincidência',
    reincidencia_30d_atacado INT COMMENT 'Reincidência 30D atacado (REINC_30D_ATACADO)',
    reincidencia_tipo_atacado TEXT COMMENT 'Tipo de reincidência atacado (REINC_TIPO_ATACADO)',
    reincidencia_30d_acesso INT COMMENT 'Reincidência 30D acesso (REINC_30D_ACESSO)',
    reincidencia_tipo_acesso TEXT COMMENT 'Tipo de reincidência acesso (REINC_TIPO_ACESSO)',
    prox_reinc TEXT COMMENT 'Próxima reincidência',
    originou_reinc_grupo TEXT COMMENT 'Originou reincidência grupo',
    prox_reinc_grupo TEXT COMMENT 'Próxima reincidência grupo',
    
    -- ==========================================
    -- DIVERSOS
    -- ==========================================
    maior_doze_flag INT COMMENT 'Flag maior que 12',
    tipo_empresa TEXT COMMENT 'Tipo de empresa',
    projeto TEXT COMMENT 'Projeto',
    id_projeto TEXT COMMENT 'ID do projeto',
    top_atacado TEXT COMMENT 'Top atacado',
    tj TEXT COMMENT 'TJ',
    
    -- ==========================================
    -- KPI / ORIGEM
    -- ==========================================
    kpi TEXT COMMENT 'KPI',
    kpi_acesso TEXT COMMENT 'KPI acesso',
    origem TEXT COMMENT 'Origem',
    sistema_origem TEXT COMMENT 'Sistema de origem',
    
    -- ==========================================
    -- TRIGGER / PLANTA
    -- ==========================================
    triagem_flag INT COMMENT 'Flag triagem (TRIAGEM_FLAG)',
    planta_flag INT COMMENT 'Flag planta (PLANTA_FLAG)',
    tipo_acesso TEXT COMMENT 'Tipo de acesso',
    
    -- ==========================================
    -- CONTATO
    -- ==========================================
    contato_nome TEXT COMMENT 'Nome do contato',
    contato_telefone TEXT COMMENT 'Telefone do contato',
    reclamante_nome TEXT COMMENT 'Nome do reclamante',
    reclamante_telefone TEXT COMMENT 'Telefone do reclamante',
    
    -- ==========================================
    -- TRATATIVAS
    -- ==========================================
    R30_Tratativas TEXT COMMENT 'Tratativas R30',
    
    -- ==========================================
    -- CAMPOS DE CONTROLE
    -- ==========================================
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Data de criação do registro',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Data da última atualização',
    
    -- ==========================================
    -- ÍNDICES
    -- ==========================================
    UNIQUE KEY unique_bd (bd(255)),
    INDEX idx_bd (bd(255)),
    INDEX idx_data_abertura (data_abertura(19)),
    INDEX idx_data_encerramento (data_encerramento(19)),
    INDEX idx_data_baixa (data_baixa(19)),
    INDEX idx_data_abertura_ano (data_abertura_ano),
    INDEX idx_data_abertura_mes (data_abertura_mes),
    INDEX idx_mes_ano_abertura (mes_ano_abertura(7)),
    INDEX idx_mes_ano_enc (mes_ano_enc(7)),
    INDEX idx_cluster (cluster(100)),
    INDEX idx_regional (regional(100)),
    INDEX idx_regional_vivo (regional_vivo(100)),
    INDEX idx_procedencia (procedencia(100)),
    INDEX idx_segmento_comercial (segmento_comercial(100)),
    INDEX idx_segmento_novo (segmento_novo(100)),
    INDEX idx_massiva_flag (massiva_flag),
    INDEX idx_triagem_flag (triagem_flag),
    INDEX idx_reincidencia_30d (reincidencia_30d),
    INDEX idx_protocolo_crm (protocolo_crm(100)),
    INDEX idx_kpi (kpi(100)),
    INDEX idx_cidade (cidade(100)),
    INDEX idx_uf (uf(2)),
    INDEX idx_cliente_nome (cliente_nome(255)),
    INDEX idx_cnpj (cnpj(20)),
    INDEX idx_grupo_economico (grupo_economico(255))
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
  COMMENT='Tabela para armazenar dados de reparos B2B - Nova API BDS (2026-02-27)';

-- ==========================================
-- FIM DO SCRIPT DE CRIAÇÃO DA TABELA
-- ==========================================
