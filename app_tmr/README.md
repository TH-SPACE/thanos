# Sistema de Cálculo de TMR (Tempo Médio de Reparos)

## Descrição
Sistema web para calcular o tempo médio dos reparos B2B, com interface para visualização por cluster e regional.

## Funcionalidades

### Acesso à Página
- Acessar a `b2btmr.html` pelo endpoint `/tmr`
- Requer login, semelhante ao app_he

### Transferência de Base
- Consulta SQL Oracle: realiza consulta dos últimos 3 meses conforme o arquivo `consulta.sql`
- Salva consulta no banco MariaDB na tabela `reparos_b2b_tmr`
- Rotina: executa a consulta e salvamento no banco a cada 12 horas

### Página Principal
- Filtro por Grupo: filtro por grupo (`grp_nome`) nas abas de Cluster e Regional
- Página com abas: Primeira aba com visão por Cluster, segunda por Regional
- Visão por Cluster: Tabela com clusters, mostrando os meses e 5 colunas com informações: <4horas, >4horas, % Dentro(<4 horas / total), Total e TMR
- Visão por Regional: Tabela com regionais, mostrando os meses e 5 colunas com informações: <4horas, >4horas, % Dentro(<4 horas / total), Total e TMR
- Cálculo: Baseado na coluna `tqi_codigo` que se repete várias vezes (cada repetição é uma vida do código) e na coluna `tmr_total` que calcula o tempo em horas

### Funcionalidades Recentes
- **Filtro por Grupo**: Adicionado filtro por grupo (`grp_nome`) nas abas de Cluster e Regional. O filtro é aplicado no backend antes do agrupamento por `tqi_codigo`.
- **Cálculo por Mês**: Corrigido cálculo do TMR para considerar apenas o tempo do reparo no mês específico, não o tempo acumulado.
- **Contagem por Mês**: Reparos são contabilizados em todos os meses em que têm vidas, não apenas no mês da primeira vida.
- **Listagem Completa de Grupos**: O dropdown de grupos mostra todos os grupos disponíveis mesmo após aplicar um filtro.
- **Remoção do Filtro de Mês**: O filtro de mês mencionado no manual original não foi implementado, mantendo apenas os últimos 3 meses automaticamente.

## Estrutura de Pastas
- `controllers/` - Controladores para as rotas
- `middleware/` - Middleware de autenticação
- `public/` - Arquivos estáticos (CSS, JS)
- `routes/` - Definições de rotas
- `services/` - Serviços de backend, como sincronização
- `views/` - Templates HTML

## Configurações Necessárias
- Configurar variáveis de ambiente no `.env` para conexão com os bancos de dados
- Criar a tabela `reparos_b2b_tmr` no banco MariaDB usando o script `criar_tabela_tmr.sql`

## Instalação e Execução
1. Assegure-se de ter as dependências do projeto principal instaladas
2. Execute o script `criar_tabela_tmr.sql` no banco MariaDB
3. Inicialize o serviço de sincronização de dados
4. Acesse o sistema via rota `/tmr` após autenticação

## Autores
Sistema desenvolvido conforme especificações no manual.md