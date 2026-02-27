# 🔄 ATUALIZAÇÃO API BDS - NOVA ESTRUTURA

**Data:** 2026-02-27  
**Motivo:** A API BDS mudou a estrutura dos dados de resposta

---

## 📋 RESUMO DAS MUDANÇAS

### 1. Campos que Mudaram de Nome

| Campo Antigo | Campo Novo |
|-------------|-----------|
| `bd` | `BD` (maiúsculo) |
| `designador_lp_13` | `LP_13` |
| `segmento_sistema` | `SEGMENTO_SIGITM` |
| `segmento_novo` | `SEGMENTO_COMERCIAL_NOVO` |
| `cliente_nome` | `CLIENTE` |
| `localidade_codigo` | `CNL` |
| `area_codigo` | `AREA` |
| `escritorio_codigo` | `ESCRITORIO` |
| `endereco` | `ENDERECO` |
| `status_nome` | `STATUS` |
| `baixa_n1_nome` | `BAIXA_N1` |
| `baixa_n2_nome` | `BAIXA_N2` |
| `baixa_n3_nome` | `BAIXA_N3` |
| `baixa_n4_nome` | `BAIXA_N4` |
| `baixa_n5_nome` | `BAIXA_N5` |
| `grupo` | `GRUPO_MIS` |
| `grupo_novo` | `GRUPO_PER_B2B` |
| `foco_acoes` | `FOCO_MIS` |
| `foco_novo` | `FOCO_PER_B2B` |
| `tmr` | `TMR_MIN` |
| `tempo_parada` | `TEMPO_PARADA_MIN` |
| `reincidencia_30d` | `REINC_30D` |
| `reincidencia_tipo` | `REINC_TIPO` |

---

### 2. Campos NOVOS Adicionados

#### Informações Principais
- `tipo_ngem`
- `protocolo_crm`
- `ID_VANTIVE`
- `SLM_FLAG`
- `atendimento_valor`
- `SEGMENTO_COMERCIAL`

#### Endereço
- `CPCC`
- `SERVICO`

#### Datas Compostas (Abertura)
- `data_abertura_dia_semana`
- `data_abertura_dia`
- `data_abertura_mes`
- `data_abertura_ano`
- `MES_ANO_ABERTURA`

#### Datas Compostas (Reparo)
- `data_reparo_dia_semana`
- `data_reparo_dia`
- `data_reparo_mes`
- `data_reparo_ano`

#### Datas Compostas (Encerramento)
- `data_encerramento_dia_semana`
- `data_encerramento_dia`
- `data_encerramento_mes`
- `data_encerramento_ano`
- `MES_ANO_ENC`

#### Datas Compostas (Baixa)
- `data_baixa_dia_semana`
- `data_baixa_dia`
- `data_baixa_mes`
- `data_baixa_ano`

#### Baixa
- `BAIXA_CODIGO`

#### Acionamentos
- `acionamento_tecnico`
- `acionamento_operadora`
- `acionamento_integradora`
- `acionamento_parceiro`
- `acionamento_transmissao`
- `acionamento_ccr`
- `acionamento_osp`
- `acionamento_diag_b2b`

#### SLA
- `sla_tipo`

#### Operadora
- `massiva_flag`

#### Reincidência
- `REINC_30D_GRUPO`
- `REINC_30D_ATACADO`
- `REINC_TIPO_ATACADO`
- `REINC_30D_ACESSO`
- `REINC_TIPO_ACESSO`
- `originou_reinc_grupo`
- `prox_reinc_grupo`

#### Diversos
- `maior_doze_flag`
- `tipo_empresa`
- `id_projeto`
- `top_atacado`
- `tj`

#### Trigger e Planta
- `TRIAGEM_FLAG`
- `PLANTA_FLAG`

#### Contato
- `contato_nome`
- `reclamante_nome`
- `reclamante_telefone`
- `contato_telefone`
- `flag_intragov`

#### TMR
- `tmr_exp_reparo_min`
- `tmr_exp_min`

---

## 📁 ARQUIVOS MODIFICADOS

### 1. `app_b2b/controllers/sincronizacaoController.js`
- Atualizado mapeamento de campos da API para o banco
- Agora usa `item.BD || item.bd` para compatibilidade
- Mapeamento segue a ordem do JSON da nova API

### 2. `app_b2b/jobs/syncBDS.js`
- Atualizado mapeamento de campos da API para o banco
- Agora usa `item.BD || item.bd` para compatibilidade
- Mapeamento segue a ordem do JSON da nova API

### 3. `app_b2b/controllers/reparosB2BController.js`
- Atualizado `columnMapping` para nova estrutura (137 colunas)
- Alterada verificação de header para aceitar `bd` ou `BD`
- Atualizadas posições de cidade (índice 23) e UF (índice 24)
- Atualizada lista de colunas date para incluir campos compostos

### 4. `app_b2b/atualizar_tabela_reparosb2b_v2.sql` (NOVO)
- Script SQL para adicionar novas colunas na tabela
- Todos os campos são TEXT (exceto campos de data que são INT)
- Inclui criação de índices adicionais

---

## 🚀 COMO ATUALIZAR

### Passo 1: Atualizar o Banco de Dados

Execute o script SQL no banco de dados:

```bash
mysql -u usuario -p nome_do_banco < app_b2b/atualizar_tabela_reparosb2b_v2.sql
```

Ou via MySQL Workbench/phpMyAdmin:
1. Abra o arquivo `atualizar_tabela_reparosb2b_v2.sql`
2. Execute no banco de dados correspondente

### Passo 2: Reiniciar o Servidor

```bash
# Parar o servidor
Ctrl+C

# Iniciar o servidor
npm start
# ou
node server.js
```

### Passo 3: Testar a Sincronização

1. **Sincronização Manual:**
   - Acesse: `http://localhost:3000/b2b`
   - Clique em "Sincronizar BDS"
   - Selecione um período e regionais
   - Execute a sincronização

2. **Upload XLSX:**
   - Baixe o novo modelo de planilha (se necessário)
   - Faça upload de um arquivo com a nova estrutura
   - Verifique se os dados foram processados corretamente

3. **Sincronização Automática:**
   - Verifique os logs nos horários agendados (05:00, 12:00, 17:00)
   - Ou execute manualmente via endpoint

---

## 🧪 TESTES

### Testar Conexão API
```bash
curl http://localhost:3000/b2b/sincronizacao/testar
```

### Testar Sincronização Manual
```bash
curl -X POST http://localhost:3000/b2b/sincronizacao/sincronizar \
  -H "Content-Type: application/json" \
  -d '{
    "regionais": ["CENTRO-OESTE", "NORTE"],
    "kpis": ["KPI"],
    "dataInicial": "2026-02-25",
    "dataFinal": "2026-02-27",
    "tipoData": "buscaporabertura"
  }'
```

---

## 📊 ESTRUTURA DO BANCO

### Total de Colunas: ~140

**Principais grupos:**
- Identificação: `bd`, `bd_raiz`, `id_circuito`, `protocolo_crm`, `id_vantive`
- Status: `status_codigo`, `status_nome`, `tipo_ngem`
- Segmento: `segmento_sistema`, `segmento_comercial`, `segmento_novo`, `segmento_v3`
- Cliente: `cliente_nome`, `cnpj`, `grupo_economico`
- Endereço: `endereco`, `cidade`, `uf`, `cluster`, `regional`
- LP/Serviço: `lp_15`, `designador_lp_13`, `velocidade`, `produto_nome`
- Datas: `data_abertura`, `data_reparo`, `data_encerramento`, `data_baixa` + componentes
- Baixa: `baixa_n1_codigo`, `baixa_n1_nome`, ..., `baixa_codigo`
- Grupo: `grupo`, `grupo_novo`, `foco_acoes`, `foco_novo`
- TMR: `tmr`, `tmr_sem_parada`, `tempo_parada`, `tmr_exp_reparo_min`
- Reincidência: `reincidencia_30d`, `reincidencia_tipo`, + variações
- Acionamentos: `acionamento_tecnico`, `acionamento_operadora`, ...
- Contato: `contato_nome`, `contato_telefone`, `reclamante_nome`, ...
- Flags: `massiva_flag`, `triagem_flag`, `planta_flag`, `flag_intragov`

---

## ⚠️ PONTOS DE ATENÇÃO

1. **Campo BD agora é maiúsculo** na API (`BD` em vez de `bd`)
   - Código atualizado para aceitar ambos: `item.BD || item.bd`

2. **Novas colunas de data são INT** (dia, mês, ano separados)
   - Facilita filtragem e agrupamento por período

3. **Campos de acionamento são INT** (0 ou 1)
   - Representam flags booleanas

4. **Upload XLSX deve seguir nova ordem**
   - 137 colunas na ordem do JSON da API
   - Header deve ter `BD` ou `bd` na primeira coluna

5. **Dados históricos são mantidos**
   - Campos antigos permanecem para compatibilidade
   - Novos campos são populados apenas com nova API

---

## 🔍 SOLUÇÃO DE PROBLEMAS

### Erro: "Column 'xxx' doesn't exist"
**Solução:** Execute o script SQL de atualização da tabela

### Erro: "ER_DUP_ENTRY"
**Solução:** Verifique se há dados duplicados no BD. O sistema faz UPDATE automático.

### Sincronização não retorna dados
**Solução:** 
1. Verifique se a API BDS está acessível
2. Teste credenciais no `.env`
3. Verifique os filtros (período, regionais, KPIs)

### Upload XLSX falha
**Solução:**
1. Verifique se o arquivo tem a nova estrutura (137 colunas)
2. Confira se o header está correto
3. Verifique logs no console

---

## 📞 SUPORTE

Dúvidas ou problemas:
- **Logs:** Console do servidor
- **Tabela de logs:** `logs_sync_b2b`
- **Arquivo de job:** `app_b2b/jobs/syncBDS.js`

---

**Status:** ✅ ATUALIZADO  
**Última atualização:** 2026-02-27
