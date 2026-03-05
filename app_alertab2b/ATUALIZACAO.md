# 📋 Atualização do Projeto Alerta B2B

## ✅ O que foi implementado

### 1. Estrutura do Banco de Dados
- **Tabela `backlog_b2b`**: Armazena todos os registros do CSV
- **Tabela `logs_sync_alertab2b`**: Histórico de sincronizações
- Script SQL: `backlog_b2b_table.sql`

### 2. Backend (Node.js)

#### Controllers
- **`controllers/alertaB2BController.js`**
  - `executarSincronizacao()` - Baixa e processa o CSV
  - `buscarBacklog(filtros)` - Busca dados com paginação e filtros
  - `buscarEstatisticas()` - Retorna estatísticas do backlog
  - `baixarCSV()` - Download do CSV
  - `parseCSV()` - Parse do conteúdo CSV

#### Rotas
- **`routes/alertaB2BRoutes.js`**
  - `GET /alerta-b2b/` - Página principal
  - `POST /alerta-b2b/sincronizar` - Executa sincronização manual
  - `GET /alerta-b2b/backlog` - Busca dados com filtros
  - `GET /alerta-b2b/estatisticas` - Retorna estatísticas

#### Jobs
- **`jobs/syncAlertaB2B.js`**
  - Sincronização automática a cada **5 minutos**
  - Configurável via `.env`

#### Inicializador
- **`initAlertaB2BSync.js`** - Inicializa o job ao iniciar o servidor

### 3. Frontend (HTML/CSS/JS)

#### Página Principal
- **`public/index.html`**
  - Cards de estatísticas
  - Filtros avançados
  - Tabela com paginação
  - Modal de detalhes

#### Estilos
- **`public/assets/css/style.css`**
  - Design moderno e responsivo
  - Cards animados
  - Tabela com hover
  - Modal com animação

#### JavaScript
- **`public/assets/js/app.js`**
  - Carregamento assíncrono de dados
  - Filtros dinâmicos
  - Paginação
  - Modal de detalhes
  - Sincronização via AJAX

### 4. Configurações

#### Variáveis de Ambiente (`.env`)
```env
ALERTA_B2B_CSV_URL=https://brtdtlts0002fu.redecorp.br/bdsla/index/excel
ALERTA_B2B_IGNORE_SSL=true
ALERTA_B2B_SYNC_AUTOMATICO=true
ALERTA_B2B_INTERVALO_SYNC=5min
ALERTA_B2B_HORARIO_SYNC=06:00
ALERTA_B2B_FONTE=url
```

#### Server.js
- Rota estática adicionada: `/alerta-b2b`
- Rota da API: `/alerta-b2b/*`
- Job inicializado automaticamente

---

## 🔄 Fluxo de Sincronização

### Sincronização Automática (5 em 5 minutos)
1. Job agenda execução a cada 5 minutos
2. Baixa CSV da URL configurada
3. **Trunca a tabela** `backlog_b2b`
4. Insere todos os novos registros
5. Salva log na tabela `logs_sync_alertab2b`

### Sincronização Manual
1. Usuário clica em "🔄 Sincronizar"
2. Frontend faz POST em `/alerta-b2b/sincronizar`
3. Backend executa mesmo processo da automática
4. Frontend atualiza dados e mostra mensagem

---

## 📊 Como Usar

### 1. Acessar a Página
```
http://localhost:3001/alerta-b2b/
```

### 2. Visualizar Dados
- Cards mostram totais no topo
- Tabela lista todos os registros
- Clique em uma linha para ver detalhes

### 3. Filtrar Dados
Preencha os filtros:
- **BD** - Buscar por número do BD
- **CNPJ** - Buscar por CNPJ
- **Cliente** - Nome do cliente
- **Regional** - Filtro por regional
- **Status** - Ativo ou Parado
- **Grupo** - Grupo responsável
- **Data** - Período de criação

Clique em **"🔍 Filtrar"** para aplicar.

### 4. Sincronizar Dados
- Clique em **"🔄 Sincronizar"** no topo
- Aguarde a mensagem de confirmação
- Dados serão atualizados automaticamente

---

## 🎯 Próximos Passos (Sugestões)

### Filtros Adicionais
- [ ] Filtro por urgência (Alta, Baixa, etc.)
- [ ] Filtro por tipo de serviço
- [ ] Filtro por procedência
- [ ] Filtro por operadora

### Funcionalidades
- [ ] Exportar para Excel/CSV
- [ ] Gráficos de dashboard
- [ ] Alertas por email
- [ ] Histórico de mudanças
- [ ] Comparativo entre sincronizações

### Melhorias
- [ ] Ordenação por colunas
- [ ] Seleção múltipla de registros
- [ ] Marcar registros como lidos
- [ ] Comentários/anotações por registro

---

## 🐛 Troubleshooting

### Tabela não aparece os dados
1. Verifique se as tabelas foram criadas:
```sql
SHOW TABLES LIKE 'backlog_b2b';
```

2. Execute o script SQL manualmente:
```bash
mysql -u thiago -p123456 co < app_alertab2b/backlog_b2b_table.sql
```

### Sincronização falha
1. Verifique os logs no terminal
2. Teste manualmente:
```bash
cd app_alertab2b
node test_sync.js arquivo
```

### Página não carrega
1. Verifique se o servidor está rodando
2. Acesse: `http://localhost:3001/alerta-b2b/`
3. Verifique o console do navegador (F12)

---

## 📝 Estrutura de Arquivos

```
app_alertab2b/
├── controllers/
│   └── alertaB2BController.js      # Lógica principal
├── routes/
│   └── alertaB2BRoutes.js          # Rotas da API
├── jobs/
│   └── syncAlertaB2B.js            # Job automático
├── public/
│   ├── index.html                  # Página principal
│   └── assets/
│       ├── css/
│       │   └── style.css           # Estilos
│       └── js/
│           └── app.js              # JavaScript frontend
├── initAlertaB2BSync.js            # Inicializador
├── backlog_b2b_table.sql           # Script SQL
├── BacklogBDSLA.csv                # Arquivo local (backup)
├── test_sync.js                    # Script de teste
├── README.md                       # Documentação
└── ATUALIZACAO.md                  # Este arquivo
```

---

## 🚀 Comandos Úteis

### Testar sincronização
```bash
cd D:\thanos\app_alertab2b
node test_sync.js arquivo
```

### Ver logs de sincronização
```sql
SELECT * FROM logs_sync_alertab2b ORDER BY data_sync DESC LIMIT 10;
```

### Contar registros
```sql
SELECT COUNT(*) as total FROM backlog_b2b;
```

### Ver status dos registros
```sql
SELECT status, COUNT(*) as quantidade 
FROM backlog_b2b 
GROUP BY status;
```

---

**Atualizado em:** 2026-03-05  
**Autor:** Thiago Alves Nunes
