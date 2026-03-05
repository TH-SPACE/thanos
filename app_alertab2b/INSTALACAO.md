# 🚀 Guia de Instalação Rápida - Alerta B2B

## Passo 1: Criar as Tabelas no Banco

Execute o script SQL no seu banco MariaDB/MySQL:

```bash
mysql -u thiago -p123456 co < D:\thanos\app_alertab2b\backlog_b2b_table.sql
```

Ou manualmente via MySQL Workbench/phpMyAdmin copiando o conteúdo do arquivo `backlog_b2b_table.sql`.

## Passo 2: Configurar .env

As configurações já foram adicionadas ao `.env`. Verifique se estão assim:

```env
ALERTA_B2B_CSV_URL=https://brtdtlts0002fu.redecorp.br/bdsla/index/excel
ALERTA_B2B_IGNORE_SSL=true
ALERTA_B2B_SYNC_AUTOMATICO=true
ALERTA_B2B_INTERVALO_SYNC=5min
ALERTA_B2B_HORARIO_SYNC=06:00
ALERTA_B2B_FONTE=url
```

## Passo 3: Reiniciar o Servidor

Pare o servidor atual (Ctrl+C) e inicie novamente:

```bash
npm run dev
```

Ou no PM2:

```bash
pm2 restart thanos
```

## Passo 4: Testar a Sincronização

### Opção A: Via Interface Web
1. Acesse: `http://localhost:3001/alerta-b2b/`
2. Clique em **"🔄 Sincronizar"**
3. Aguarde a mensagem de confirmação

### Opção B: Via Script
```bash
cd D:\thanos\app_alertab2b
node test_sync.js arquivo
```

### Opção C: Via API
```bash
curl -X POST http://localhost:3001/alerta-b2b/sincronizar -H "Content-Type: application/json" -d "{\"fonte\":\"arquivo\"}"
```

## Passo 5: Verificar os Dados

### No Banco
```sql
SELECT COUNT(*) as total FROM backlog_b2b;
SELECT status, COUNT(*) as qtd FROM backlog_b2b GROUP BY status;
```

### Na Interface
Acesse `http://localhost:3001/alerta-b2b/` e veja:
- Cards de estatísticas
- Tabela com registros
- Filtros funcionando

---

## ✅ Checklist de Verificação

- [ ] Tabelas criadas no banco
- [ ] Configurações no .env
- [ ] Servidor reiniciado
- [ ] Sincronização testada
- [ ] Dados aparecendo na tabela
- [ ] Interface web acessível

---

## 🆘 Problemas Comuns

### Erro: "Table doesn't exist"
Execute o script SQL novamente.

### Erro: "Cannot find module"
Verifique se está na pasta correta:
```bash
cd D:\thanos\app_alertab2b
```

### Página em branco
Verifique o console do navegador (F12) e os logs do servidor.

### Sincronização não roda
Verifique se `ALERTA_B2B_SYNC_AUTOMATICO=true` no `.env`.

---

**Tempo estimado:** 5 minutos  
**Dificuldade:** Fácil
