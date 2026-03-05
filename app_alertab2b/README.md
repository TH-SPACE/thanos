# 📊 Alerta B2B - Backlog BDSLA

Módulo do ThanOS responsável por sincronizar e gerenciar os dados do Backlog BDSLA.

## 🎯 Funcionalidades

- **Sincronização automática**: Baixa dados do CSV periodicamente
- **API REST**: Endpoints para buscar dados e estatísticas
- **Logs de sincronização**: Histórico completo das sincronizações
- **Filtros e busca**: Consulta dados com diversos filtros

## 📁 Estrutura de Pastas

```
app_alertab2b/
├── controllers/
│   └── alertaB2BController.js    # Lógica principal de processamento
├── routes/
│   └── alertaB2BRoutes.js        # Rotas da API
├── jobs/
│   └── syncAlertaB2B.js          # Job de sincronização automática
├── initAlertaB2BSync.js          # Inicializador do serviço
├── backlog_b2b_table.sql         # Script SQL das tabelas
├── BacklogBDSLA.csv              # Arquivo CSV local (backup)
└── README.md                     # Esta documentação
```

## 🚀 Configuração

### 1. Criar as tabelas no banco de dados

Execute o script SQL no seu banco MariaDB/MySQL:

```bash
mysql -u thiago -p co < app_alertab2b/backlog_b2b_table.sql
```

Ou execute manualmente o conteúdo do arquivo `backlog_b2b_table.sql`.

### 2. Configurar variáveis de ambiente

Adicione ao arquivo `.env`:

```env
# URL do CSV do Backlog BDSLA
ALERTA_B2B_CSV_URL=https://brtdtlts0002fu.redecorp.br/bdsla/index/excel

# Ignorar verificação de SSL (true/false)
ALERTA_B2B_IGNORE_SSL=true

# Habilitar sincronização automática (true/false)
ALERTA_B2B_SYNC_AUTOMATICO=true

# Horário da sincronização automática (HH:MM)
ALERTA_B2B_HORARIO_SYNC=06:00

# Fonte dos dados: 'url' ou 'arquivo'
ALERTA_B2B_FONTE=url
```

## 📡 Endpoints da API

### `GET /alerta-b2b`
Página principal da interface web.

### `GET /alerta-b2b/index.html`
Página HTML completa para visualização dos dados.

### `POST /alerta-b2b/sincronizar`
Executa a sincronização dos dados.

**Body (opcional):**
```json
{
  "fonte": "url"  // ou "arquivo"
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Sincronização realizada com sucesso!",
  "dados": {
    "inseridos": 1500,
    "atualizados": 100,
    "erros": 5,
    "total": 1605
  }
}
```

### `GET /alerta-b2b/backlog`
Busca dados do backlog com filtros.

**Query Params:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| pagina | int | Número da página (default: 1) |
| limite | int | Registros por página (default: 50) |
| bd | string | Filtrar por BD |
| cnpj | string | Filtrar por CNPJ |
| regional | string | Filtrar por regional |
| status | string | Filtrar por status |
| grupo | string | Filtrar por grupo |
| dataInicio | date | Data de criação inicial |
| dataFim | date | Data de criação final |

**Exemplo:**
```
GET /alerta-b2b/backlog?pagina=1&limite=100&regional=SUDESTE&status=Ativo
```

### `GET /alerta-b2b/estatisticas`
Retorna estatísticas do backlog.

**Resposta:**
```json
{
  "success": true,
  "dados": {
    "geral": {
      "total_registros": 1620,
      "total_regionais": 7,
      "total_clientes": 890,
      "ativos": 1200,
      "parados": 420,
      "prazo_medio": 2.5,
      "sla_medio": 500.75
    },
    "regionais": [...],
    "status": [...]
  }
}
```

## ⏰ Sincronização Automática

A sincronização automática é executada diariamente no horário configurado (`ALERTA_B2B_HORARIO_SYNC`).

### Configurar horário

No arquivo `.env`:
```env
ALERTA_B2B_HORARIO_SYNC=06:00
```

### Executar manualmente

Via API:
```bash
curl -X POST http://localhost:3001/alerta-b2b/sincronizar
```

Ou via código Node.js:
```javascript
const { executarSincronizacao } = require('./app_alertab2b/controllers/alertaB2BController');
executarSincronizacao('url');  // ou 'arquivo'
```

## 📊 Estrutura da Tabela

### `backlog_b2b`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INT | Chave primária |
| bd | VARCHAR | ID do backlog (único) |
| grupo | VARCHAR | Grupo responsável |
| procedencia | VARCHAR | Procedência |
| tipo_servico | VARCHAR | Tipo de serviço |
| data_criacao | DATETIME | Data de criação |
| nome_usuario | VARCHAR | Nome do usuário |
| cnpj | VARCHAR | CNPJ do cliente |
| nome_cliente | VARCHAR | Nome do cliente |
| segmento_cliente | VARCHAR | Segmento |
| reclamacao | TEXT | Reclamação |
| lp | VARCHAR | LP |
| id_vantive | VARCHAR | ID Vantive |
| servico_nome | VARCHAR | Nome do serviço |
| regional | VARCHAR | Regional |
| municipio | VARCHAR | Município |
| uf | VARCHAR | UF |
| status | VARCHAR | Status |
| sla | DECIMAL | SLA |
| prazo | DECIMAL | Prazo |
| urgencia | VARCHAR | Urgência |
| ... | ... | (demais campos) |

### `logs_sync_alertab2b`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INT | Chave primária |
| data_sync | DATETIME | Data da sincronização |
| tipo_sync | VARCHAR | Tipo (automatico/manual) |
| fonte_url | VARCHAR | URL/origem dos dados |
| total_registros | INT | Total de registros |
| registros_inseridos | INT | Inseridos |
| registros_atualizados | INT | Atualizados |
| registros_erro | INT | Com erro |
| status_sync | VARCHAR | Status (sucesso/parcial/erro) |
| duracao_segundos | DECIMAL | Duração em segundos |
| mensagem | TEXT | Mensagem |
| erro_detalhe | TEXT | Detalhe do erro |

## 🔧 Troubleshooting

### Erro de SSL/Certificado
Se o CSV estiver em servidor com certificado auto-assinado:
```env
ALERTA_B2B_IGNORE_SSL=true
```

### Timeout no download
Aumente o timeout no controller (linha 68):
```javascript
timeout: 120000  // 120 segundos
```

### Erro na sincronização
Verifique os logs no terminal e a tabela `logs_sync_alertab2b`:
```sql
SELECT * FROM logs_sync_alertab2b ORDER BY data_sync DESC LIMIT 10;
```

## 📝 Exemplos de Uso

### Buscar todos os backlogs ativos de uma regional
```javascript
fetch('http://localhost:3001/alerta-b2b/backlog?regional=SUDESTE&status=Ativo&limite=100')
  .then(r => r.json())
  .then(console.log);
```

### Obter estatísticas
```javascript
fetch('http://localhost:3001/alerta-b2b/estatisticas')
  .then(r => r.json())
  .then(console.log);
```

### Sincronizar manualmente
```javascript
fetch('http://localhost:3001/alerta-b2b/sincronizar', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ fonte: 'url' })
})
  .then(r => r.json())
  .then(console.log);
```

## 📌 Notas

- O CSV usa ponto e vírgula (`;`) como delimitador
- Os dados são atualizados automaticamente via `ON DUPLICATE KEY UPDATE`
- A sincronização automática usa o fuso horário `America/Sao_Paulo`

## 👨‍💻 Autor

Thiago Alves Nunes
