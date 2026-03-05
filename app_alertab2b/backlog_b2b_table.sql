-- ===========================================
-- Tabela: backlog_b2b
-- Descrição: Armazena dados do Backlog BDSLA
-- Origem: https://brtdtlts0002fu.redecorp.br/bdsla/index/excel
-- Criado em: 2026-03-05
-- ===========================================

CREATE TABLE IF NOT EXISTS backlog_b2b (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bd VARCHAR(50) NOT NULL UNIQUE,
    grupo VARCHAR(255),
    procedencia VARCHAR(100),
    tipo_servico VARCHAR(100),
    data_criacao DATETIME,
    nome_usuario VARCHAR(255),
    cnpj VARCHAR(50),
    nome_cliente VARCHAR(500),
    segmento_cliente VARCHAR(100),
    reclamacao TEXT,
    lp VARCHAR(100),
    id_vantive VARCHAR(100),
    servico_nome VARCHAR(255),
    regional VARCHAR(100),
    municipio VARCHAR(255),
    uf VARCHAR(2),
    raiz VARCHAR(50),
    status VARCHAR(100),
    sla DECIMAL(15,2),
    tipo INT,
    prazo DECIMAL(15,6),
    urgencia_codigo INT,
    urgencia VARCHAR(100),
    origem VARCHAR(100),
    tipo_abertura VARCHAR(100),
    status_circuito VARCHAR(100),
    fonte_status VARCHAR(100),
    indice INT,
    last_update DATETIME,
    flag_covid19 VARCHAR(50),
    operadora VARCHAR(255),
    segmento_sf VARCHAR(100),
    id_projeto VARCHAR(100),
    flag_prioridade VARCHAR(100),
    reincidencia INT,
    contato_cliente VARCHAR(255),
    atuacao_gi VARCHAR(255),
    area_escalonada VARCHAR(255),
    nivel_escalonamento VARCHAR(100),
    vivo_gi VARCHAR(100),
    cluster VARCHAR(100),
    segmento_v3 VARCHAR(100),
    data_importacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_bd (bd),
    INDEX idx_cnpj (cnpj),
    INDEX idx_regional (regional),
    INDEX idx_status (status),
    INDEX idx_data_criacao (data_criacao),
    INDEX idx_last_update (last_update)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- Tabela: logs_sync_alertab2b
-- Descrição: Armazena logs de sincronização do Alerta B2B
-- ===========================================

CREATE TABLE IF NOT EXISTS logs_sync_alertab2b (
    id INT AUTO_INCREMENT PRIMARY KEY,
    data_sync DATETIME NOT NULL,
    tipo_sync VARCHAR(50) DEFAULT 'automatico',
    fonte_url VARCHAR(500),
    filtro_uf VARCHAR(100) DEFAULT 'CO-NORTE',
    total_registros INT DEFAULT 0,
    registros_inseridos INT DEFAULT 0,
    registros_filtrados INT DEFAULT 0,
    registros_atualizados INT DEFAULT 0,
    registros_erro INT DEFAULT 0,
    status_sync VARCHAR(50) DEFAULT 'sucesso',
    duracao_segundos DECIMAL(10,2),
    mensagem TEXT,
    erro_detalhe TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_data_sync (data_sync),
    INDEX idx_status_sync (status_sync)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
