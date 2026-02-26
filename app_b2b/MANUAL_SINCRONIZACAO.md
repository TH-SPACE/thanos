# 🔄 Manual de Sincronização BDS

## ✅ Implementação Concluída!

A sincronização com o sistema BDS foi implementada com sucesso.

**Recursos disponíveis:**
- ✅ Sincronização manual via interface
- ✅ Upload de arquivo XLSX
- ✅ **Sincronização automática 3x ao dia (05:00, 12:00 e 17:00)**

---

## 📋 O Que Foi Criado

### Arquivos Novos:

| Arquivo | Descrição |
|---------|-----------|
| `app_b2b/controllers/sincronizacaoController.js` | Controller de sincronização |
| `app_b2b/public/js/sincronizacao_b2b.js` | JavaScript do frontend |
| `app_b2b/jobs/syncBDS.js` | Job de sincronização automática |
| `app_b2b/initB2BSync.js` | Inicializador do serviço |
| `.env` | Configurações de ambiente |

### Arquivos Modificados:

| Arquivo | Modificação |
|---------|-------------|
| `app_b2b/routes/b2bRoutes.js` | Adicionadas rotas de sincronização |
| `app_b2b/public/reparos_b2b.html` | Adicionado botão e modal |
| `server.js` | Inicialização do serviço BDS |

---

## 🚀 Como Usar (Sincronização Manual)

### Passo 1: Acessar o Sistema

Acesse: `http://localhost:3000/b2b` (ou seu servidor)

### Passo 2: Verificar Permissão

**Atenção:** Os botões de **Upload XLSX** e **Sincronizar BDS** são visíveis apenas para usuários com perfil **ADM**.

Se você não vir os botões, verifique com o administrador do sistema se seu usuário tem permissão ADM.

### Passo 3: Clicar em "Sincronizar BDS"

Botão azul claro no topo da página, ao lado do botão "Upload XLSX":

```
┌─────────────────────────────────────────────────────┐
│  📊 Desempenho BDs                                  │
│                                                     │
│            [📥 Sincronizar BDS] [📤 Upload XLSX]    │
└─────────────────────────────────────────────────────┘
```

### Passo 4: Preencher o Modal

```
┌─────────────────────────────────────────────┐
│  📊 Sincronizar Dados BDS                   │
├─────────────────────────────────────────────┤
│  Data Inicial: [01/02/2026]                 │
│  Data Final:   [23/02/2026]                 │
│                                             │
│  Tipo de Busca:                             │
│  ☑ Por Data de Abertura                     │
│  ◯ Por Data de Encerramento                 │
│  ◯ Por Data de Fechamento                   │
│  ◯ Apenas Abertos                           │
│                                             │
│  📍 Regionais:                              │
│  ☑ Selecionar Todas                         │
│  ☑ CENTRO-OESTE  ☑ NORDESTE  ☑ NORTE...    │
│                                             │
│  📊 KPIs: Todos os KPIs (24)                │
│     (sincronização automática)              │
│                                             │
│  [Cancelar]        [📥 Sincronizar BDS]     │
└─────────────────────────────────────────────┘
```

**Tipos de Busca disponíveis:**
- **Por Data de Abertura**: Busca registros pela data de abertura
- **Por Data de Encerramento**: Busca registros pela data de encerramento
- **Por Data de Fechamento**: Busca registros pela data de fechamento
- **Apenas Abertos**: Busca apenas registros em aberto (sem data)

**Observação:** Os KPIs são sincronizados automaticamente (todos os 24 KPIs), não sendo necessário selecionar manualmente.

### Passo 5: Aguardar Processamento

Durante a sincronização, você verá:
```
🔄 Sincronizando dados... Aguarde.
```

### Passo 6: Resultado

Ao final:
```
✅ 85 inseridos, 15 atualizados
```

A tabela será atualizada automaticamente!

---

## ⏰ Sincronização Automática (3x ao Dia)

A sincronização automática é executada **3 vezes ao dia** nos seguintes horários:

| Horário | Descrição |
|---------|-----------|
| **05:00** | Sincronização da manhã |
| **12:00** | Sincronização do meio-dia |
| **17:00** | Sincronização da tarde |

### Como Funciona

1. **Ao iniciar o servidor**, o sistema verifica se a sincronização automática está habilitada
2. **Nos horários configurados**, o sistema executa automaticamente:
   - Autenticação na API BDS
   - Busca de dados com filtros pré-configurados
   - Inserção/atualização no banco de dados
   - Logs detalhados no console

### Configuração (.env)

Edite o arquivo `.env` para personalizar a sincronização automática:

```env
# ===========================================
# SINCRONIZAÇÃO AUTOMÁTICA - B2B (3x ao dia)
# ===========================================
# Habilitar sincronização automática (true/false)
BDS_SYNC_AUTOMATICO=true

# Horários da sincronização automática
BDS_SYNC_HORARIO_1=05:00
BDS_SYNC_HORARIO_2=12:00
BDS_SYNC_HORARIO_3=17:00

# Regionais para sincronização automática (separadas por vírgula)
BDS_SYNC_REGIONAIS=NORTE,CENTRO-OESTE

# KPIs para sincronização automática (separados por vírgula)
# Deixe vazio para enviar todos os 24 KPIs
BDS_SYNC_KPIS=

# Período padrão para sincronização automática (dias atrás)
BDS_SYNC_DIAS_ATRAS=30

# Tipo de busca padrão para sincronização automática
# Opções: buscaporabertura, buscaporfechamento, buscaporencerramento, buscaporabertos
BDS_SYNC_TIPO_BUSCA=buscaporabertura
```

### Parâmetros Configuráveis

| Parâmetro | Valor Padrão | Descrição |
|-----------|-------------|-----------|
| `BDS_SYNC_AUTOMATICO` | `true` | Habilita/desabilita sincronização automática |
| `BDS_SYNC_HORARIO_1` | `05:00` | Primeiro horário de execução |
| `BDS_SYNC_HORARIO_2` | `12:00` | Segundo horário de execução |
| `BDS_SYNC_HORARIO_3` | `17:00` | Terceiro horário de execução |
| `BDS_SYNC_REGIONAIS` | `NORTE,CENTRO-OESTE` | Regionais a sincronizar |
| `BDS_SYNC_KPIS` | (vazio) | KPIs (vazio = todos 24 KPIs) |
| `BDS_SYNC_DIAS_ATRAS` | `30` | Período de dados (dias para trás) |
| `BDS_SYNC_TIPO_BUSCA` | `buscaporabertura` | Tipo de busca padrão |

### Exemplo de Log no Console

```
======================================================================
🤖 INICIALIZANDO SINCRONIZAÇÃO AUTOMÁTICA DO BDS
======================================================================
📅 Configuração:
   - Horário 1: 05:00
   - Horário 2: 12:00
   - Horário 3: 17:00
   - Regionais: NORTE, CENTRO-OESTE
   - Dias para trás: 30
   - Tipo de busca: buscaporabertura
======================================================================

✅ Jobs agendados com sucesso!
   - Job 1: 05:00 (cron: 0 5 * * *)
   - Job 2: 12:00 (cron: 0 12 * * *)
   - Job 3: 17:00 (cron: 0 17 * * *)
   - Fuso horário: America/Sao_Paulo
======================================================================

⏰ [CRON] Executando sincronização das 05:00...

======================================================================
🔄 [AUTO] INICIANDO SINCRONIZAÇÃO BDS
======================================================================
📅 Data/Hora: 26/02/2026 05:00:01
📊 Período: 2026-01-27 até 2026-02-26 (30 dias)
📍 Tipo de Busca: buscaporabertura
🗺️  Regionais: NORTE, CENTRO-OESTE
📈 KPIs: 24 KPIs
======================================================================

📡 [1/4] Autenticando na API BDS...
   ✅ Token obtido com sucesso!

📊 [2/4] Buscando dados na API BDS...
   ✅ 150 registros encontrados!

💾 [3/4] Conectando ao banco de dados...
   ✅ Conexão estabelecida!

📝 [4/4] Processando registros...
   Total de registros: 150
   📊 Progresso: 50/150 processados...
   📊 Progresso: 100/150 processados...
   📊 Progresso: 150/150 processados...

======================================================================
✅ [AUTO] SINCRONIZAÇÃO CONCLUÍDA!
======================================================================
📊 RESULTADOS:
   ✅ Inseridos: 120
   🔄 Atualizados: 25
   ❌ Erros: 5
   📦 Total processado: 150
   📊 Taxa de sucesso: 96.7%
======================================================================
```

### Como Desativar a Sincronização Automática

Para desativar, edite o `.env`:

```env
BDS_SYNC_AUTOMATICO=false
```

Reinicie o servidor para aplicar as mudanças.

### Como Alterar os Horários

Edite os horários no `.env`:

```env
# Exemplo: 06:00, 14:00 e 20:00
BDS_SYNC_HORARIO_1=06:00
BDS_SYNC_HORARIO_2=14:00
BDS_SYNC_HORARIO_3=20:00
```

**Formato:** `HH:MM` (24 horas)

### Como Alterar as Regionais

Edite a lista de regionais no `.env`:

```env
# Exemplo: todas as regionais
BDS_SYNC_REGIONAIS=NORTE,CENTRO-OESTE,SUL,SUDESTE - LESTE,SUDESTE - MINAS,SP CAPITAL,SP INTERIOR,NORDESTE
```

### Como Alterar o Período

Edite o número de dias no `.env`:

```env
# Exemplo: sincronizar últimos 60 dias
BDS_SYNC_DIAS_ATRAS=60
```

---

## 🔧 Configurações (.env)

As credenciais já estão configuradas no arquivo `.env`:

```env
BDS_API_URL=http://10.124.100.227:4012
BDS_USUARIO=g0056865
BDS_SENHA=Thi0202@@
```

**Importante:** Não compartilhe este arquivo!

---

## 📊 Rotas Criadas

### 1. Sincronizar Dados (POST)
```
POST /b2b/sincronizacao/sincronizar
Content-Type: application/json

{
  "regionais": ["NORTE", "CENTRO-OESTE"],
  "kpis": ["KPI", "EXP_LM"],
  "dataInicial": "2026-02-01",
  "dataFinal": "2026-02-23",
  "tipoData": "buscaporabertura",
  "cliente": ""
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Sincronização concluída! 85 inseridos, 15 atualizados.",
  "inseridos": 85,
  "atualizados": 15,
  "erros": 0,
  "total": 100
}
```

### 2. Testar Conexão (GET)
```
GET /b2b/sincronizacao/testar
```

**Resposta:**
```json
{
  "success": true,
  "message": "Conexão com BDS estabelecida com sucesso!",
  "autenticado": true,
  "registros_teste": 10
}
```

### 3. Listar Regionais (GET)
```
GET /b2b/sincronizacao/regionais
```

### 4. Listar KPIs (GET)
```
GET /b2b/sincronizacao/kpis
```

---

## 🛠️ Funcionalidades Implementadas

### ✅ Correção Automática de Clusters

O sistema corrige automaticamente os clusters com base na cidade/UF:

| Cidade/UF | Cluster Corrigido |
|-----------|-------------------|
| FORMOSA, CIDADE OCIDENTAL, VALPARAISO, PLANALTINA, LUZIANIA, LUZIÂNIA | BRASILIA |
| ANAPOLIS, ANÁPOLIS, JARAGUA, JARAGUÁ | ANAPOLIS |
| PA | BELEM |
| AP, AM, RR | MANAUS |
| AC, MS, RO | CAMPO GRANDE |
| MT | CUIABA |
| GO | GOIANIA |
| TO | PALMAS |
| DF | BRASILIA |
| MA | SAO LUIS |
| Outros | OUTRO |

### ✅ Formatação Automática de Datas

Datas no formato `DD/MM/YYYY HH:MM:SS` são convertidas para `YYYY-MM-DD HH:MM:SS` (padrão MySQL).

### ✅ INSERT ou UPDATE Automático

- Se o registro **não existe**: INSERT
- Se o registro **já existe**: UPDATE (pelo campo `bd`)

---

## 🐛 Solução de Problemas

### Erro: "Falha na autenticação"

**Causa:** Usuário ou senha incorretos

**Solução:**
1. Verifique o arquivo `.env`
2. Teste login manualmente no sistema BDS
3. Execute: `node test_bds_completo.js` para testar conexão

---

### Erro: "Nenhum dado encontrado"

**Causa:** Filtros muito restritivos ou período sem dados

**Solução:**
1. Amplie o período (datas)
2. Selecione mais regionais ou KPIs
3. Verifique se há dados no sistema BDS original

---

### Erro: "Timeout" ou "Conexão recusada"

**Causa:** Sistema BDS indisponível ou fora da rede

**Solução:**
1. Verifique se está na rede interna/VPN
2. Teste: `ping 10.124.100.227`
3. Acesse: `http://10.124.100.227:4012` no navegador

---

### Erro: "ER_DUP_ENTRY" mesmo com UPDATE

**Causa:** Constraint de unicidade no banco

**Solução:**
1. Verifique se a tabela `reparosb2b` tem constraint UNIQUE no campo `bd`
2. Se não tiver, adicione:
```sql
ALTER TABLE reparosb2b ADD UNIQUE KEY unique_bd (bd);
```

---

## 📈 Próximos Passos (Futuro)

### 1. Log de Sincronizações no Banco

Criar tabela para histórico de sincronizações:

```sql
CREATE TABLE sync_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    data_sync DATETIME,
    periodoinicio DATE,
    periodofim DATE,
    inseridos INT,
    atualizados INT,
    erros INT,
    status VARCHAR(20)
);
```

### 2. Dashboard de Sincronização

Criar página para visualizar:
- Histórico de sincronizações
- Quantidade de registros processados
- Taxa de sucesso por dia
- Logs de erros

---

## 📞 Suporte

Dúvidas ou problemas, consulte:

- **Documentação completa:** `SINCRONIZACAO_BDS.md`
- **Script de teste:** `test_bds_completo.js`
- **Log do processo:** Console do servidor
- **Arquivos de job:** `app_b2b/jobs/syncBDS.js`

---

**Status:** ✅ Implementado e Funcional

**Recursos:**
- ✅ Sincronização manual via interface
- ✅ Upload de arquivo XLSX
- ✅ Sincronização automática 3x ao dia (05:00, 12:00 e 17:00)

**Última atualização:** 2026-02-26
