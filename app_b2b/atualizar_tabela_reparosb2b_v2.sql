-- ==========================================
-- ATUALIZAÇÃO DA TABELA reparosb2b
-- Nova estrutura da API BDS (2026-02-27)
-- ==========================================
-- Este script adiciona as novas colunas provenientes da nova API BDS
-- Todos os campos são TEXT para evitar problemas de formatação,
-- exceto campos de data que são DATE e campos numéricos que são INT
-- ==========================================

-- ==========================================
-- 1. NOVOS CAMPOS - INFORMAÇÕES PRINCIPAIS
-- ==========================================

ALTER TABLE reparosb2b 
ADD COLUMN IF NOT EXISTS protocolo_crm TEXT COMMENT 'Protocolo CRM' AFTER bd;

ALTER TABLE reparosb2b 
ADD COLUMN IF NOT EXISTS id_vantive TEXT COMMENT 'ID Vantive' AFTER protocolo_crm;

ALTER TABLE reparosb2b 
ADD COLUMN IF NOT EXISTS tipo_ngem TEXT COMMENT 'Tipo NGEM' AFTER status_nome;

ALTER TABLE reparosb2b 
ADD COLUMN IF NOT EXISTS segmento_comercial TEXT COMMENT 'Segmento comercial' AFTER segmento_sistema;

ALTER TABLE reparosb2b 
ADD COLUMN IF NOT EXISTS atendimento_valor TEXT COMMENT 'Atendimento valor' AFTER segmento_v3;

ALTER TABLE reparosb2b 
ADD COLUMN IF NOT EXISTS slm_flag TEXT COMMENT 'Flag SLM' AFTER atendimento_valor;

-- ==========================================
-- 2. NOVOS CAMPOS - ENDEREÇO
-- ==========================================

ALTER TABLE reparosb2b 
ADD COLUMN IF NOT EXISTS cpcc TEXT COMMENT 'CPCC' AFTER servico_cpcc_nome;

ALTER TABLE reparosb2b 
ADD COLUMN IF NOT EXISTS servico TEXT COMMENT 'Serviço' AFTER produto_nome;

-- ==========================================
-- 3. NOVOS CAMPOS - DATAS COMPOSTAS
-- ==========================================

-- Data de abertura (componentes)
ALTER TABLE reparosb2b 
ADD COLUMN IF NOT EXISTS data_abertura_dia_semana INT COMMENT 'Dia da semana da abertura' AFTER data_abertura;

ALTER TABLE reparosb2b 
ADD COLUMN IF NOT EXISTS data_abertura_dia INT COMMENT 'Dia da abertura' AFTER data_abertura_dia_semana;

ALTER TABLE reparosb2b 
ADD COLUMN IF NOT EXISTS data_abertura_mes INT COMMENT 'Mês da abertura' AFTER data_abertura_dia;

ALTER TABLE reparosb2b 
ADD COLUMN IF NOT EXISTS data_abertura_ano INT COMMENT 'Ano da abertura' AFTER data_abertura_mes;

ALTER TABLE reparosb2b 
ADD COLUMN IF NOT EXISTS mes_ano_abertura TEXT COMMENT 'Mês/ano da abertura' AFTER data_abertura_ano;

-- Data de reparo (componentes)
ALTER TABLE reparosb2b 
ADD COLUMN IF NOT EXISTS data_reparo_dia_semana INT COMMENT 'Dia da semana do reparo' AFTER data_reparo;

ALTER TABLE reparosb2b 
ADD COLUMN IF NOT EXISTS data_reparo_dia INT COMMENT 'Dia do reparo' AFTER data_reparo_dia_semana;

ALTER TABLE reparosb2b 
ADD COLUMN IF NOT EXISTS data_reparo_mes INT COMMENT 'Mês do reparo' AFTER data_reparo_dia;

ALTER TABLE reparosb2b 
ADD COLUMN IF NOT EXISTS data_reparo_ano INT COMMENT 'Ano do reparo' AFTER data_reparo_mes;

-- Data de encerramento (componentes)
ALTER TABLE reparosb2b 
ADD COLUMN IF NOT EXISTS data_encerramento_dia_semana INT COMMENT 'Dia da semana do encerramento' AFTER data_encerramento;

ALTER TABLE reparosb2b 
ADD COLUMN IF NOT EXISTS data_encerramento_dia INT COMMENT 'Dia do encerramento' AFTER data_encerramento_dia_semana;

ALTER TABLE reparosb2b 
ADD COLUMN IF NOT EXISTS data_encerramento_mes INT COMMENT 'Mês do encerramento' AFTER data_encerramento_dia;

ALTER TABLE reparosb2b 
ADD COLUMN IF NOT EXISTS data_encerramento_ano INT COMMENT 'Ano do encerramento' AFTER data_encerramento_mes;

ALTER TABLE reparosb2b 
ADD COLUMN IF NOT EXISTS mes_ano_enc TEXT COMMENT 'Mês/ano do encerramento' AFTER data_encerramento_ano;

-- Data de baixa (componentes)
ALTER TABLE reparosb2b 
ADD COLUMN IF NOT EXISTS data_baixa_dia_semana INT COMMENT 'Dia da semana da baixa' AFTER data_baixa;

ALTER TABLE reparosb2b 
ADD COLUMN IF NOT EXISTS data_baixa_dia INT COMMENT 'Dia da baixa' AFTER data_baixa_dia_semana;

ALTER TABLE reparosb2b 
ADD COLUMN IF NOT EXISTS data_baixa_mes INT COMMENT 'Mês da baixa' AFTER data_baixa_dia;

ALTER TABLE reparosb2b 
ADD COLUMN IF NOT EXISTS data_baixa_ano INT COMMENT 'Ano da baixa' AFTER data_baixa_mes;

-- ==========================================
-- 4. NOVOS CAMPOS - BAIXA
-- ==========================================

ALTER TABLE reparosb2b 
ADD COLUMN IF NOT EXISTS baixa_codigo TEXT COMMENT 'Código da baixa' AFTER baixa_n5_nome;

-- ==========================================
-- 5. NOVOS CAMPOS - ACIONAMENTOS
-- ==========================================

ALTER TABLE reparosb2b 
ADD COLUMN IF NOT EXISTS acionamento_tecnico INT COMMENT 'Acionamento técnico' AFTER intragov_codigo;

ALTER TABLE reparosb2b 
ADD COLUMN IF NOT EXISTS acionamento_operadora INT COMMENT 'Acionamento operadora' AFTER acionamento_tecnico;

ALTER TABLE reparosb2b 
ADD COLUMN IF NOT EXISTS acionamento_integradora INT COMMENT 'Acionamento integradora' AFTER acionamento_operadora;

ALTER TABLE reparosb2b 
ADD COLUMN IF NOT EXISTS acionamento_parceiro INT COMMENT 'Acionamento parceiro' AFTER acionamento_integradora;

ALTER TABLE reparosb2b 
ADD COLUMN IF NOT EXISTS acionamento_transmissao INT COMMENT 'Acionamento transmissão' AFTER acionamento_parceiro;

ALTER TABLE reparosb2b 
ADD COLUMN IF NOT EXISTS acionamento_ccr INT COMMENT 'Acionamento CCR' AFTER acionamento_transmissao;

ALTER TABLE reparosb2b 
ADD COLUMN IF NOT EXISTS acionamento_osp INT COMMENT 'Acionamento OSP' AFTER acionamento_ccr;

ALTER TABLE reparosb2b 
ADD COLUMN IF NOT EXISTS acionamento_diag_b2b INT COMMENT 'Acionamento diag B2B' AFTER acionamento_osp;

-- ==========================================
-- 6. NOVOS CAMPOS - SLA
-- ==========================================

ALTER TABLE reparosb2b 
ADD COLUMN IF NOT EXISTS sla_tipo TEXT COMMENT 'Tipo de SLA' AFTER sla_horas;

-- ==========================================
-- 7. NOVOS CAMPOS - GRUPO
-- ==========================================

-- Renomear grupo_baixa_codigo se existir para grupo_baixa_codigo_old
-- (mantemos o campo atual e adicionamos os novos)

-- ==========================================
-- 8. NOVOS CAMPOS - OPERADORA
-- ==========================================

ALTER TABLE reparosb2b 
ADD COLUMN IF NOT EXISTS massiva_flag INT COMMENT 'Flag massiva' AFTER tipo_operadora;

-- ==========================================
-- 9. NOVOS CAMPOS - REINCIDÊNCIA
-- ==========================================

ALTER TABLE reparosb2b 
ADD COLUMN IF NOT EXISTS reincidencia_30d_grupo INT COMMENT 'Reincidência 30D grupo' AFTER reincidencia_30d;

ALTER TABLE reparosb2b 
ADD COLUMN IF NOT EXISTS reincidencia_30d_atacado INT COMMENT 'Reincidência 30D atacado' AFTER originou_reinc;

ALTER TABLE reparosb2b 
ADD COLUMN IF NOT EXISTS reincidencia_tipo_atacado TEXT COMMENT 'Tipo de reincidência atacado' AFTER reincidencia_30d_atacado;

ALTER TABLE reparosb2b 
ADD COLUMN IF NOT EXISTS reincidencia_30d_acesso INT COMMENT 'Reincidência 30D acesso' AFTER reincidencia_tipo_atacado;

ALTER TABLE reparosb2b 
ADD COLUMN IF NOT EXISTS reincidencia_tipo_acesso TEXT COMMENT 'Tipo de reincidência acesso' AFTER reincidencia_30d_acesso;

ALTER TABLE reparosb2b 
ADD COLUMN IF NOT EXISTS originou_reinc_grupo TEXT COMMENT 'Originou reincidência grupo' AFTER prox_reinc;

ALTER TABLE reparosb2b 
ADD COLUMN IF NOT EXISTS prox_reinc_grupo TEXT COMMENT 'Próxima reincidência grupo' AFTER originou_reinc_grupo;

-- ==========================================
-- 10. NOVOS CAMPOS - DIVERSOS
-- ==========================================

ALTER TABLE reparosb2b 
ADD COLUMN IF NOT EXISTS maior_doze_flag INT COMMENT 'Flag maior que 12' AFTER prox_reinc_grupo;

ALTER TABLE reparosb2b 
ADD COLUMN IF NOT EXISTS tipo_empresa TEXT COMMENT 'Tipo de empresa' AFTER maior_doze_flag;

ALTER TABLE reparosb2b 
ADD COLUMN IF NOT EXISTS id_projeto TEXT COMMENT 'ID do projeto' AFTER sistema_origem;

ALTER TABLE reparosb2b 
ADD COLUMN IF NOT EXISTS top_atacado TEXT COMMENT 'Top atacado' AFTER projeto;

ALTER TABLE reparosb2b 
ADD COLUMN IF NOT EXISTS tj TEXT COMMENT 'TJ' AFTER top_atacado;

-- ==========================================
-- 11. NOVOS CAMPOS - TRIGGER E PLANTA
-- ==========================================

ALTER TABLE reparosb2b 
ADD COLUMN IF NOT EXISTS triagem_flag INT COMMENT 'Flag triagem' AFTER tmr_sem_parada;

ALTER TABLE reparosb2b 
ADD COLUMN IF NOT EXISTS planta_flag INT COMMENT 'Flag planta' AFTER triagem_flag;

-- ==========================================
-- 12. NOVOS CAMPOS - CONTATO
-- ==========================================

ALTER TABLE reparosb2b 
ADD COLUMN IF NOT EXISTS contato_nome TEXT COMMENT 'Nome do contato' AFTER tipo_acesso;

ALTER TABLE reparosb2b 
ADD COLUMN IF NOT EXISTS reclamante_nome TEXT COMMENT 'Nome do reclamante' AFTER contato_nome;

ALTER TABLE reparosb2b 
ADD COLUMN IF NOT EXISTS reclamante_telefone TEXT COMMENT 'Telefone do reclamante' AFTER reclamante_nome;

ALTER TABLE reparosb2b 
ADD COLUMN IF NOT EXISTS contato_telefone TEXT COMMENT 'Telefone do contato' AFTER reclamante_telefone;

ALTER TABLE reparosb2b 
ADD COLUMN IF NOT EXISTS flag_intragov INT COMMENT 'Flag intragov' AFTER contato_telefone;

-- ==========================================
-- 13. NOVOS CAMPOS - TMR
-- ==========================================

ALTER TABLE reparosb2b 
ADD COLUMN IF NOT EXISTS tmr_exp_reparo_min TEXT COMMENT 'TMR exp reparo (min)' AFTER R30_Tratativas;

ALTER TABLE reparosb2b 
ADD COLUMN IF NOT EXISTS tmr_exp_min TEXT COMMENT 'TMR exp (min)' AFTER tmr_exp_reparo_min;

-- ==========================================
-- 14. CAMPOS REMOVIDOS/DEPRECATED
-- ==========================================
-- Os seguintes campos NÃO serão mais populados pela nova API:
-- - grupo_baixa_codigo (substituído por outros campos)
-- - horario_func_inicio
-- - horario_func_fim
-- - decorrido_sem_parada (substituído por tmr_sem_parada)
-- Mantemos por compatibilidade com dados históricos

-- ==========================================
-- 15. ÍNDICES ADICIONAIS
-- ==========================================

-- Criar índices para novas colunas de data
CREATE INDEX IF NOT EXISTS idx_data_abertura_ano ON reparosb2b(data_abertura_ano);
CREATE INDEX IF NOT EXISTS idx_data_abertura_mes ON reparosb2b(data_abertura_mes);
CREATE INDEX IF NOT EXISTS idx_mes_ano_abertura ON reparosb2b(mes_ano_abertura);
CREATE INDEX IF NOT EXISTS idx_mes_ano_enc ON reparosb2b(mes_ano_enc);

-- Criar índices para novas colunas de filtro
CREATE INDEX IF NOT EXISTS idx_segmento_comercial ON reparosb2b(segmento_comercial);
CREATE INDEX IF NOT EXISTS idx_massiva_flag ON reparosb2b(massiva_flag);
CREATE INDEX IF NOT EXISTS idx_triagem_flag ON reparosb2b(triagem_flag);
CREATE INDEX IF NOT EXISTS idx_reincidencia_30d ON reparosb2b(reincidencia_30d);
CREATE INDEX IF NOT EXISTS idx_protocolo_crm ON reparosb2b(protocolo_crm);

-- ==========================================
-- 16. COMENTÁRIOS NAS COLUNAS
-- ==========================================

-- Adicionar comentários nas novas colunas (já incluídos no ALTER TABLE)

-- ==========================================
-- FIM DO SCRIPT DE ATUALIZAÇÃO
-- ==========================================

-- Verificar estrutura final
-- DESCRIBE reparosb2b;
