# 📍 Filtro de UF - Centro-Oeste e Norte

## Visão Geral

O sistema Alerta B2B foi configurado para salvar **apenas** registros das regiões **Centro-Oeste** e **Norte**.

## UF's Incluídas

### Centro-Oeste (4 UF's)
| UF | Nome Completo |
|----|---------------|
| GO | Goiás |
| MT | Mato Grosso |
| MS | Mato Grosso do Sul |
| DF | Distrito Federal |

### Norte (7 UF's)
| UF | Nome Completo |
|----|---------------|
| AC | Acre |
| AP | Amapá |
| AM | Amazonas |
| PA | Pará |
| RO | Rondônia |
| RR | Roraima |
| TO | Tocantins |

**Total: 11 UF's**

## Como Funciona

### No Backend

O filtro está implementado no arquivo `controllers/alertaB2BController.js`:

```javascript
const UFS_PERMITIDAS = [
    // Centro-Oeste
    'GO', 'MATO GROSSO', 'MT', 'MATO GROSSO DO SUL', 'MS', 'DISTRITO FEDERAL', 'DF',
    // Norte
    'AC', 'AMAPA', 'AP', 'AMAZONAS', 'AM', 'PARA', 'PA', 'RONDONIA', 'RO', 'RORAIMA', 'RR', 'TOCANTINS', 'TO'
];
```

Durante a sincronização:
1. Cada registro é verificado
2. Se a UF **não** estiver na lista, o registro é **filtrado** (ignorado)
3. Se a UF **estiver** na lista, o registro é **salvo** no banco

### No Frontend

Um aviso visual é mostrado no topo da página:

```
📍 Filtro ativo: Apenas registros de Centro-Oeste e Norte
(GO, MT, MS, DF, AC, AP, AM, PA, RO, RR, TO)
```

## Logs de Sincronização

A tabela `logs_sync_alertab2b` registra:
- `filtro_uf`: 'CO-NORTE'
- `registros_filtrados`: Quantidade de registros ignorados por não serem da região

## Exemplo de Log

```
📊 Total de registros para processar: 1620
🗑️  Limpando tabela antes de inserir novos dados...
✅ Tabela limpa com sucesso!
📝 Inserindo novos registros (Filtro: Centro-Oeste e Norte)...
📊 Progresso: 100/1620 processados...
📊 Progresso: 200/1620 processados...

======================================================================
✅ SINCRONIZAÇÃO CONCLUÍDA!
======================================================================
📊 RESULTADOS:
   ✅ Inseridos: 450
   🚫 Filtrados (não CO/Norte): 1150
   ❌ Erros: 0
   📦 Total processado: 1620
   📊 Taxa de sucesso: 27.8%
```

## Alterar o Filtro

### Para adicionar mais regiões

Edite `controllers/alertaB2BController.js`:

```javascript
const UFS_PERMITIDAS = [
    // Centro-Oeste
    'GO', 'MATO GROSSO', 'MT', 'MATO GROSSO DO SUL', 'MS', 'DISTRITO FEDERAL', 'DF',
    // Norte
    'AC', 'AMAPA', 'AP', 'AMAZONAS', 'AM', 'PARA', 'PA', 'RONDONIA', 'RO', 'RORAIMA', 'RR', 'TOCANTINS', 'TO',
    // Adicione novas UF's aqui
    'SP', 'RIO DE JANEIRO', 'RJ', // Exemplo: Sudeste
];
```

### Para remover o filtro

Comente a verificação no loop:

```javascript
// COMENTAR ESTA LINHA PARA REMOVER O FILTRO
// if (!UFS_PERMITIDAS.includes(uf)) {
//     filtrados++;
//     continue;
// }
```

### Para filtrar outras regiões

Substitua a lista:

```javascript
const UFS_PERMITIDAS = [
    // Apenas Sudeste
    'SP', 'SAO PAULO', 'RJ', 'RIO DE JANEIRO', 
    'MG', 'MINAS GERAIS', 'ES', 'ESPIRITO SANTO'
];
```

## Consulta no Banco

### Ver quantos registros por UF

```sql
SELECT uf, COUNT(*) as quantidade 
FROM backlog_b2b 
GROUP BY uf 
ORDER BY quantidade DESC;
```

### Ver apenas de uma UF específica

```sql
SELECT * FROM backlog_b2b WHERE uf = 'GO';
```

### Contar total por região

```sql
SELECT 
    CASE 
        WHEN uf IN ('GO', 'MT', 'MS', 'DF') THEN 'Centro-Oeste'
        WHEN uf IN ('AC', 'AP', 'AM', 'PA', 'RO', 'RR', 'TO') THEN 'Norte'
        ELSE 'Outra'
    END as regiao,
    COUNT(*) as quantidade
FROM backlog_b2b
GROUP BY regiao;
```

## Impacto no Armazenamento

Com o filtro ativo:
- ✅ Menos espaço em banco de dados
- ✅ Consultas mais rápidas
- ✅ Foco nas regiões de interesse
- ❌ Dados de outras regiões não estão disponíveis

## Histórico de Versões

| Data | Versão | Mudança |
|------|--------|---------|
| 2026-03-05 | 1.0 | Implementado filtro CO/Norte |

---

**Documentação criada em:** 2026-03-05  
**Projeto:** Alerta B2B - ThanOS
