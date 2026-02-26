-- ============================================
-- Tabela de Logs de Sincronização - BDS B2B
-- ============================================
-- Nome: logs_sync_b2b
-- Descrição: Registra todas as sincronizações 
--            automáticas e manuais do sistema BDS
-- ============================================

CREATE TABLE IF NOT EXISTS logs_sync_b2b (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'ID do log',
    
    -- Data e hora da sincronização
    data_sync DATETIME NOT NULL COMMENT 'Data e hora da sincronização',
    
    -- Tipo de sincronização
    tipo_sync ENUM('manual', 'automatico', 'upload') NOT NULL DEFAULT 'manual' 
        COMMENT 'Tipo: manual (via interface), automatico (cron), upload (XLSX)',
    
    -- Período dos dados sincronizados
    periodo_inicio DATE NULL COMMENT 'Data inicial do período sincronizado',
    periodo_fim DATE NULL COMMENT 'Data final do período sincronizado',
    
    -- Filtros utilizados
    regionais TEXT NULL COMMENT 'Regionais sincronizadas (JSON array)',
    kpis TEXT NULL COMMENT 'KPIs sincronizados (JSON array)',
    tipo_busca VARCHAR(50) NULL COMMENT 'Tipo de busca: buscaporabertura, etc.',
    
    -- Resultados da sincronização
    total_registros INT DEFAULT 0 COMMENT 'Total de registros encontrados na API',
    registros_inseridos INT DEFAULT 0 COMMENT 'Quantidade de registros inseridos',
    registros_atualizados INT DEFAULT 0 COMMENT 'Quantidade de registros atualizados',
    registros_erro INT DEFAULT 0 COMMENT 'Quantidade de erros no processamento',
    
    -- Status e duração
    status_sync ENUM('sucesso', 'parcial', 'erro') NOT NULL DEFAULT 'sucesso' 
        COMMENT 'Status: sucesso (100%), parcial (>0%), erro (0%)',
    duracao_segundos DECIMAL(10,2) NULL COMMENT 'Duração da sincronização em segundos',
    
    -- Mensagens e erros
    mensagem TEXT NULL COMMENT 'Mensagem descritiva do resultado',
    erro_detalhe TEXT NULL COMMENT 'Detalhe do erro (se houver)',
    
    -- Usuário responsável (para sincronização manual)
    usuario VARCHAR(100) NULL COMMENT 'Usuário que executou a sincronização (manual)',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Data de criação do registro',
    
    -- Índices para consultas
    INDEX idx_data_sync (data_sync),
    INDEX idx_tipo_sync (tipo_sync),
    INDEX idx_status_sync (status_sync),
    INDEX idx_periodo (periodo_inicio, periodo_fim)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
  COMMENT='Logs de sincronização do sistema BDS - B2B';

-- ============================================
-- VIEW: Resumo diário de sincronizações
-- ============================================

CREATE OR REPLACE VIEW vw_resumo_sync_b2b AS
SELECT 
    DATE(data_sync) AS data,
    tipo_sync,
    COUNT(*) AS quantidade_syncs,
    SUM(registros_inseridos) AS total_inseridos,
    SUM(registros_atualizados) AS total_atualizados,
    SUM(registros_erro) AS total_erros,
    SUM(total_registros) AS total_processado,
    AVG(duracao_segundos) AS duracao_media_segundos,
    ROUND(
        (SUM(CASE WHEN status_sync = 'sucesso' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 
        2
    ) AS taxa_sucesso_percentual
FROM logs_sync_b2b
GROUP BY DATE(data_sync), tipo_sync
ORDER BY data DESC, tipo_sync;

-- ============================================
-- VIEW: Últimas sincronizações (resumo)
-- ============================================

CREATE OR REPLACE VIEW vw_ultimas_syncs_b2b AS
SELECT 
    id,
    data_sync,
    tipo_sync,
    status_sync,
    total_registros,
    registros_inseridos,
    registros_atualizados,
    registros_erro,
    duracao_segundos,
    mensagem,
    created_at
FROM logs_sync_b2b
ORDER BY data_sync DESC
LIMIT 100;

-- ============================================
-- Exemplos de uso
-- ============================================

-- Inserir um log de sincronização automática
-- INSERT INTO logs_sync_b2b (
--     data_sync, tipo_sync, periodo_inicio, periodo_fim,
--     regionais, kpis, tipo_busca,
--     total_registros, registros_inseridos, registros_atualizados, registros_erro,
--     status_sync, duracao_segundos, mensagem
-- ) VALUES (
--     NOW(), 'automatico', '2026-01-27', '2026-02-26',
--     '["NORTE","CENTRO-OESTE"]', '["KPI","EXP_LM"]', 'buscaporabertura',
--     150, 120, 25, 5,
--     'sucesso', 45.5, 'Sincronização automática concluída com sucesso'
-- );

-- Consultar resumo diário
-- SELECT * FROM vw_resumo_sync_b2b WHERE data >= DATE_SUB(NOW(), INTERVAL 30 DAY);

-- Consultar últimas sincronizações
-- SELECT * FROM vw_ultimas_syncs_b2b LIMIT 10;

-- ============================================
-- FIM DO SCRIPT
-- ============================================
