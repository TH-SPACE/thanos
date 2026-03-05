# 📊 Alerta B2B - Backlog BDSLA

Módulo do ThanOS para sincronizar e gerenciar dados do Backlog BDSLA.

## 🎯 Funcionalidades

- **Sincronização automática**: A cada 5 minutos (configurável)
- **Filtro de UF**: Salva apenas Centro-Oeste e Norte
- **Correção automática**: Regional e Cluster baseados em UF/cidade
- **Dashboard por cluster**: Tempo de backlog em horas e dias
- **Logs de sincronização**: Histórico completo
- **Filtros dinâmicos**: Dropdowns carregados do banco

## 📁 Estrutura

```
app_alertab2b/
├── controllers/alertaB2BController.js   # Lógica principal
├── routes/alertaB2BRoutes.js            # Rotas da API
├── jobs/syncAlertaB2B.js                # Job automático
├── public/                              # Frontend
│   ├── index.html
│   ├── css/style.css
│   └── js/app.js
├── initAlertaB2BSync.js                 # Inicializador
├── criar_tabelas.sql                    # Script SQL
└── BacklogBDSLA.csv                     # Arquivo local
```

## 🚀 Instalação

### 1. Criar tabelas
```bash
mysql -u thiago -p123456 co < app_alertab2b/criar_tabelas.sql
```

### 2. Configurar .env
```env
ALERTA_B2B_CSV_URL=https://brtdtlts0002fu.redecorp.br/bdsla/index/excel
ALERTA_B2B_IGNORE_SSL=true
ALERTA_B2B_SYNC_AUTOMATICO=true
ALERTA_B2B_INTERVALO_SYNC=5min
ALERTA_B2B_FONTE=url
```

### 3. Reiniciar servidor
```bash
npm run dev
```

### 4. Sincronizar (teste)
```bash
cd app_alertab2b
node test_sync.js arquivo
```

### 5. Acessar
```
http://localhost:3001/alerta-b2b/
```

## 🌐 Endpoints API

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/alerta-b2b/` | GET | Página principal (lista) |
| `/alerta-b2b/dashboard` | GET | **Página do dashboard** |
| `/alerta-b2b/sincronizar` | POST | Sincronizar dados |
| `/alerta-b2b/backlog` | GET | Buscar registros (com filtros) |
| `/alerta-b2b/estatisticas` | GET | Estatísticas (com filtros) |
| `/alerta-b2b/status-por-cluster` | GET | Status por cluster |
| `/alerta-b2b/dashboard` | GET | Dashboard tempo de backlog |
| `/alerta-b2b/logs` | GET | Logs de sincronização |
| `/alerta-b2b/filtros` | GET | Filtros disponíveis |

## 🔍 Filtros Disponíveis

- **BD** - Texto livre
- **Cliente** - Texto livre
- **Regional** - Dropdown (carregado do banco)
- **Cluster** - Dropdown (carregado do banco)
- **Status** - Dropdown (carregado do banco)
- **Grupo** - Autocomplete
- **Data Início/Fim** - Date picker

## 📊 Dashboard

Mostra tempo de backlog por cluster:

**Horas:** < 1h, 1-3h, 3-6h, 6-8h, 8-24h  
**Dias:** 1-3d, 3-5d, 5-7d, 7-15d, 15-30d, > 30d

## 🗺️ Correção Automática

### Regional (por UF)
- **NORTE:** AC, AP, AM, PA, RO, RR, TO + Nordeste (MA, PI, CE, RN, PB, PE, AL, SE, BA)
- **CENTRO-OESTE:** GO, MT, MS, DF
- **SUDESTE:** SP, RJ, MG, ES
- **SUL:** PR, SC, RS

### Cluster (por UF/Cidade)
- **DF** → BRASILIA
- **GO** → GOIANIA
- **MT** → CUIABA
- **MS** → CAMPO GRANDE
- **PA** → BELEM
- **AM, AP, RR** → MANAUS
- **AC, RO** → PORTO VELHO
- **TO** → PALMAS
- **MA** → SAO LUIS

## 📝 Comandos Úteis

### Testar sincronização
```bash
cd app_alertab2b
node test_sync.js arquivo
```

### Ver registros no banco
```sql
SELECT COUNT(*) FROM backlog_b2b;
SELECT cluster, COUNT(*) as qtd FROM backlog_b2b GROUP BY cluster;
SELECT uf, COUNT(*) as qtd FROM backlog_b2b GROUP BY uf;
```

### Ver logs
```sql
SELECT * FROM logs_sync_alertab2b ORDER BY data_sync DESC LIMIT 10;
```

## 🐛 Troubleshooting

| Problema | Solução |
|----------|---------|
| Cards zerados | Execute `criar_tabelas.sql` e sincronize |
| Filtro não funciona | Verifique console (F12) e logs do servidor |
| Cluster vazio | Re-sincronize os dados |
| Erro 500 | Reinicie o servidor |

---

**Atualizado:** 2026-03-05  
**Autor:** Thiago Alves Nunes
