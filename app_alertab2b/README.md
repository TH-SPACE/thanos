# 📊 Alerta B2B - Backlog BDSLA

Módulo do ThanOS para sincronizar e gerenciar dados do Backlog BDSLA.

## 🎯 Funcionalidades

- **🔄 Sincronização completa**: Baixa da URL + salva local + processa banco
- **Sincronização automática**: A cada 5 minutos (configurável)
- **Filtro de UF**: Salva apenas Centro-Oeste e Norte
- **Correção automática**: Regional e Cluster baseados em UF/cidade
- **Dashboard por cluster**: Tempo de backlog em horas e dias
- **🚨 Alerta de reparos críticos**: Reparos Ativos > 12h, 15h, 18h
- **📥 Download em Excel**: Exporta base completa com TODAS as colunas
- **Logs de sincronização**: Histórico completo
- **Filtros dinâmicos**: Dropdowns carregados do banco

## 📍 Filtro de UFs (Centro-Oeste + Norte)

### Centro-Oeste
- **GO** - Goiás
- **MT** - Mato Grosso
- **MS** - Mato Grosso do Sul
- **DF** - Distrito Federal

### Norte (inclui Nordeste)
- **AC** - Acre
- **AM** - Amazonas
- **AP** - Amapá
- **PA** - Pará
- **RO** - Rondônia
- **RR** - Roraima
- **TO** - Tocantins
- **MA** - Maranhão

## 📁 Estrutura

```
app_alertab2b/
├── controllers/alertaB2BController.js   # Lógica principal
├── routes/alertaB2BRoutes.js            # Rotas da API
├── jobs/syncAlertaB2B.js                # Job automático (5min)
├── public/                              # Frontend
│   ├── index.html
│   ├── dashboard.html
│   ├── css/style.css
│   └── js/app.js
├── initAlertaB2BSync.js                 # Inicializador
├── criar_tabelas.sql                    # Script SQL
└── BacklogBDSLA.csv                     # Arquivo local (cache)
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
ALERTA_B2B_FONTE=arquivo
```

### 3. Reiniciar servidor
```bash
pm2 restart sistema
# ou
npm run dev
```

### 4. Acessar
```
http://localhost:3001/alerta-b2b/
```

## 🔄 Fluxo de Sincronização

Quando você clica em **"🔄 Sincronizar"** ou o job automático executa:

```
1. 🌐 Baixa CSV da URL
   ↓
2. 💾 Salva no arquivo local (BacklogBDSLA.csv)
   ↓
3. 📋 Processa CSV (parse)
   ↓
4. 📍 Filtra por UF (apenas CO + Norte)
   ↓
5. 🔧 Corrige Regional/Cluster automaticamente
   ↓
6. 🗑️ Limpa tabela (TRUNCATE)
   ↓
7. ✅ Insere novos registros
   ↓
8. 📝 Salva log de sincronização
```

**Fallback**: Se a URL estiver indisponível, usa o último arquivo local.

## 🌐 Endpoints API

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/alerta-b2b/` | GET | Página principal (lista) |
| `/alerta-b2b/dashboard` | GET | **Página do dashboard** |
| `/alerta-b2b/sincronizar` | POST | Sincronizar dados (baixa + processa) |
| `/alerta-b2b/backlog` | GET | Buscar registros (com filtros) |
| `/alerta-b2b/estatisticas` | GET | Estatísticas (com filtros) |
| `/alerta-b2b/status-por-cluster` | GET | Status por cluster |
| `/alerta-b2b/reparos-criticos` | GET | **Reparos Ativos críticos** |
| `/alerta-b2b/api/dashboard` | GET | Dashboard tempo de backlog |
| `/alerta-b2b/logs` | GET | Logs de sincronização |
| `/alerta-b2b/filtros` | GET | Filtros disponíveis |
| `/alerta-b2b/exportar` | GET | **Baixar Excel com TODAS as colunas** |

## 🔍 Filtros Disponíveis

- **BD** - Texto livre
- **Cliente** - Texto livre
- **Regional** - Dropdown (carregado do banco)
- **Cluster** - Dropdown (carregado do banco)
- **Status** - Dropdown (carregado do banco)
- **Grupo** - Autocomplete
- **Data Início/Fim** - Date picker

## 📊 Dashboard

**Acesse:** `http://localhost:3001/alerta-b2b/dashboard`

### Funcionalidades do Dashboard

1. **🚨 Alerta de Reparos Críticos**
   - **Urgente (> 18h)**: Solicitar mudança para Parada IMEDIATAMENTE
   - **Atenção (15-18h)**: Solicitar mudança para Parada
   - **Alerta (12-15h)**: Monitorar de perto
   - **Monitorar (< 12h)**: Acompanhar evolução

2. **Cards de Estatísticas**
   - Total de Registros
   - Ativos / Parados
   - Clientes / Regionais

3. **⏱️ Tempo de Backlog por Cluster**
   - Barras coloridas por faixa de tempo
   - Horas: < 1h, 1-3h, 3-6h, 6-8h, 8-24h
   - Dias: 1-3d, 3-5d, 5-7d, 7-15d, 15-30d, > 30d

4. **📊 Tabela de Status por Cluster** (PRINCIPAL)
   - Total, Ativos, Parados por cluster
   - Percentual com barra de progresso
   - Ideal para cobrar clusters com muitos ativos

5. **📥 Download Excel**
   - Botão no cabeçalho para baixar base completa
   - **TODAS as 42 colunas da tabela**

### Filtros do Dashboard
- Regional, Cluster, Procedência
- Filtram todas as seções simultaneamente
- Botão "Limpar" para remover filtros

## 🗺️ Correção Automática

### Regional (por UF)
- **NORTE:** AC, AP, AM, PA, RO, RR, TO + Nordeste (MA, PI, CE, RN, PB, PE, AL, SE, BA)
- **CENTRO-OESTE:** GO, MT, MS, DF, TO, RO, AC
- **SUDESTE:** SP, RJ, MG, ES (não são salvos)
- **SUL:** PR, SC, RS (não são salvos)

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

## ⚙️ Configuração Automática

### Sincronização a cada 5 minutos
```env
ALERTA_B2B_SYNC_AUTOMATICO=true
ALERTA_B2B_INTERVALO_SYNC=5min
```

### Sincronização em horário fixo
```env
ALERTA_B2B_SYNC_AUTOMATICO=true
ALERTA_B2B_INTERVALO_SYNC=horario
ALERTA_B2B_HORARIO_SYNC=06:00
```

## 📝 Comandos Úteis

### Ver registros no banco
```sql
SELECT COUNT(*) FROM backlog_b2b;
SELECT cluster, COUNT(*) as qtd FROM backlog_b2b GROUP BY cluster;
SELECT uf, COUNT(*) as qtd FROM backlog_b2b GROUP BY uf;
SELECT regional, COUNT(*) as qtd FROM backlog_b2b GROUP BY regional;
```

### Ver logs de sincronização
```sql
SELECT * FROM logs_sync_alertab2b ORDER BY data_sync DESC LIMIT 10;
```

### Ver detalhes da última sincronização
```sql
SELECT 
    data_sync,
    total_registros,
    registros_inseridos,
    registros_filtrados,
    duracao_segundos,
    status_sync,
    mensagem
FROM logs_sync_alertab2b 
ORDER BY data_sync DESC 
LIMIT 1;
```

## 🐛 Troubleshooting

| Problema | Solução |
|----------|---------|
| Cards zerados | Execute sincronização e verifique logs |
| Filtro não funciona | Verifique console (F12) e logs do servidor |
| Cluster vazio | Re-sincronize os dados |
| Erro 502 na URL | Sistema usa fallback do arquivo local |
| Erro 500 | Reinicie o servidor: `pm2 restart sistema` |

---

**Atualizado:** 2026-03-05
**Autor:** Thiago Alves Nunes
**Versão:** 2.5.5+
