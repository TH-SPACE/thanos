# 🔄 Manual de Sincronização BDS

## ✅ Implementação Concluída!

A sincronização manual com o sistema BDS foi implementada com sucesso.

---

## 📋 O Que Foi Criado

### Arquivos Novos:

| Arquivo | Descrição |
|---------|-----------|
| `app_b2b/controllers/sincronizacaoController.js` | Controller de sincronização |
| `app_b2b/public/js/sincronizacao_b2b.js` | JavaScript do frontend |
| `.env` | Configurações de ambiente |

### Arquivos Modificados:

| Arquivo | Modificação |
|---------|-------------|
| `app_b2b/routes/b2bRoutes.js` | Adicionadas rotas de sincronização |
| `app_b2b/public/reparos_b2b.html` | Adicionado botão e modal |

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

### Passo 4: Aguardar Processamento

Durante a sincronização, você verá:
```
🔄 Sincronizando dados... Aguarde.
```

### Passo 5: Resultado

Ao final:
```
✅ 85 inseridos, 15 atualizados
```

A tabela será atualizada automaticamente!

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

### 1. Agendamento Automático

Implementar job para rodar sincronização automaticamente:

```javascript
// Exemplo: todo dia às 02:00
const cron = require('node-cron');

cron.schedule('0 2 * * *', async () => {
    console.log('🔄 Sincronização automática...');
    await sincronizarDados();
});
```

### 2. Filtros Fixos no .env

Configurar filtros padrão no `.env`:

```env
BDS_REGIONAIS_AUTOMATICO=["NORTE","CENTRO-OESTE"]
BDS_KPIS_AUTOMATICO=["KPI","EXP_LM","EXP_SLM_CLIENTE"]
BDS_DIAS_ATRAS=30
BDS_HORARIO_SYNC=0 2 * * *
```

### 3. Log de Sincronizações

Criar tabela para histórico:

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

---

## 📞 Suporte

Dúvidas ou problemas, consulte:

- **Documentação completa:** `SINCRONIZACAO_BDS.md`
- **Script de teste:** `test_bds_completo.js`
- **Log do processo:** Console do servidor

---

**Status:** ✅ Implementado e Funcional  
**Última atualização:** 2026-02-23
