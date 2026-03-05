# 🚀 GUIA COMPLETO - Testar Alerta B2B

## ⚠️ IMPORTANTE: Os cards estão zerados porque não há dados no banco!

Siga estes passos para criar as tabelas e sincronizar os dados:

---

## 📋 Passo 1: Criar as Tabelas no Banco

### Opção A: Via Linha de Comando (Recomendado)

```bash
mysql -u thiago -p123456 co < D:\thanos\app_alertab2b\criar_tabelas.sql
```

### Opção B: Via MySQL Workbench

1. Abra o MySQL Workbench
2. Conecte-se ao banco
3. Execute este comando para usar o banco:
   ```sql
   USE co;
   ```
4. Copie e cole o conteúdo do arquivo `criar_tabelas.sql`
5. Execute (⚡)

### Opção C: Manualmente

```sql
USE co;

-- Criar tabela backlog_b2b
CREATE TABLE IF NOT EXISTS backlog_b2b (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bd VARCHAR(50) NOT NULL UNIQUE,
    -- ... (resto do SQL está em criar_tabelas.sql)
);

-- Criar tabela logs_sync_alertab2b
CREATE TABLE IF NOT EXISTS logs_sync_alertab2b (
    id INT AUTO_INCREMENT PRIMARY KEY,
    -- ... (resto do SQL está em criar_tabelas.sql)
);
```

---

## ✅ Passo 2: Verificar se as Tabelas Foram Criadas

```sql
USE co;
SHOW TABLES LIKE 'backlog_b2b';
SHOW TABLES LIKE 'logs_sync_alertab2b';
```

Deve aparecer:
```
+------------------+
| Tables_in_co     |
+------------------+
| backlog_b2b      |
| logs_sync_alertab2b |
+------------------+
```

---

## 🔄 Passo 3: Reiniciar o Servidor

Se o servidor já estiver rodando, pare (Ctrl+C) e inicie novamente:

```bash
cd D:\thanos
npm run dev
```

No log você deve ver:
```
🔧 Carregando serviço de sincronização automática do Alerta B2B...
⏰ Intervalo configurado: 5min
✅ Serviço de sincronização Alerta B2B inicializado com sucesso!
```

---

## 📊 Passo 4: Sincronizar os Dados

### Opção A: Via Script (Recomendado para teste)

```bash
cd D:\thanos\app_alertab2b
node test_sync.js arquivo
```

Você deve ver:
```
======================================================================
🧪 TESTE DE SINCRONIZAÇÃO - ALERTA B2B
📍 FILTRO: Centro-Oeste e Norte (GO, MT, MS, DF, AC, AP, AM, PA, RO, RR, TO)
======================================================================

📡 Fonte selecionada: arquivo
⏳ Iniciando sincronização...

📊 Total de registros para processar: 1620
🗑️  Limpando tabela antes de inserir novos dados...
✅ Tabela limpa com sucesso!
📝 Inserindo novos registros (Filtro: Centro-Oeste e Norte)...
📊 Progresso: 100/1620 processados...
📊 Progresso: 200/1620 processados...
...

======================================================================
✅ SINCRONIZAÇÃO CONCLUÍDA!
======================================================================
📊 RESULTADOS:
   ✅ Inseridos: 450
   🚫 Filtrados (não CO/Norte): 1150
   ❌ Erros: 0
   📦 Total processado: 1620
```

### Opção B: Via Interface Web

1. Acesse: `http://localhost:3001/alerta-b2b/`
2. Clique em **"🔄 Sincronizar"**
3. Aguarde a mensagem de confirmação

---

## 🔍 Passo 5: Verificar se os Dados Foram Salvos

### No MySQL:

```sql
USE co;

-- Contar total de registros
SELECT COUNT(*) as total FROM backlog_b2b;

-- Ver por UF
SELECT uf, COUNT(*) as quantidade 
FROM backlog_b2b 
GROUP BY uf 
ORDER BY quantidade DESC;

-- Ver status
SELECT status, COUNT(*) as qtd 
FROM backlog_b2b 
GROUP BY status;
```

---

## 🌐 Passo 6: Acessar a Página

1. Abra o navegador
2. Acesse: `http://localhost:3001/alerta-b2b/`

### O Que Você Deve Ver:

✅ **Cards com números** (exemplo):
- 📦 Total de Registros: 450
- ✅ Ativos: 320
- ⏸️ Parados: 130
- 🏢 Clientes: 280
- 📍 Regionais: 5

✅ **Aviso de filtro**:
> 📍 Filtro ativo: Apenas registros de Centro-Oeste e Norte

✅ **Tabela com dados**

---

## 🧪 Passo 7: Testar os Filtros

1. Preencha algum filtro (ex: Regional = NORTE)
2. Clique em **"🔍 Filtrar"**
3. **Os cards devem atualizar** mostrando apenas:
   - Total de registros da região NORTE
   - Ativos apenas do NORTE
   - etc.

---

## 🐛 Problemas Comuns

### Cards continuam zerados

**Verifique se há dados:**
```sql
SELECT COUNT(*) FROM backlog_b2b;
```

Se retornar 0, execute a sincronização (Passo 4).

**Verifique o console do navegador:**
1. Pressione F12
2. Vá na aba "Console"
3. Veja se há erros

**Verifique o log do servidor:**
- Veja se há mensagens de erro no terminal

### Erro: "Table doesn't exist"

Execute o script SQL novamente (Passo 1).

### Erro: "Cannot GET /alerta-b2b/"

Reinicie o servidor (Passo 3).

### Página em branco

1. Verifique o console do navegador (F12)
2. Verifique se o servidor está rodando
3. Acesse: `http://localhost:3001/alerta-b2b/` (não esqueça a barra no final)

---

## 📝 Resumo Rápido

```bash
# 1. Criar tabelas
mysql -u thiago -p123456 co < D:\thanos\app_alertab2b\criar_tabelas.sql

# 2. Reiniciar servidor
npm run dev

# 3. Sincronizar (em outro terminal)
cd D:\thanos\app_alertab2b
node test_sync.js arquivo

# 4. Acessar
http://localhost:3001/alerta-b2b/
```

---

## ✅ Checklist Final

- [ ] Tabelas criadas no banco
- [ ] Servidor reiniciado
- [ ] Sincronização executada com sucesso
- [ ] Dados aparecem no banco (COUNT > 0)
- [ ] Cards mostram números (não zero)
- [ ] Tabela mostra registros
- [ ] Filtros atualizam os cards

---

**Tempo estimado:** 5 minutos  
**Dificuldade:** Fácil

Se ainda tiver problemas, me avise com o erro que aparece! 🚀
