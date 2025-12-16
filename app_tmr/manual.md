Fale comigo em portugues, leia minha pasta app_tmr.

# 💰 Sistema de Cálculo de TMR

Sistema web para calcular o tempo médio dos reparos B2B.

## 🎯 Funcionalidades 

### ✅ Acessar Página
- **Acessar a b2btmr.html pelo /tmr e para acessar tem que passar pelo login igual o app_he faz.
- **Estrutura de pastas parecida com app_he

### ✅ Transferencia de Base
- **Consulta SQL Oracle: Fazer a consulta conforme o consulta.sql dos últimos 3 meses.
- **Salvar consula no banco: remover e salvar no banco co na tabela reparos_b2b_tmr (tabela ainda não foi criada), salvar a consulta no oracle no mariadb para não consumir o oracle.
- **Rotina: Fazer essa consulta e salvamento no banco a cada 12 horas.

### ✅ Pagina Principal

- **Filtros: ter um filtro de mês, para selecionar qual o último mês da visão de 3 meses.(setando o mês atual) Ex: se coloquei Dezembro, filtrar Outubro, Novembro e Dezembro.
- **Pagina com abas: Primeira Aba visão por Cluster, Segunda por Regional depois definirei as próximas.
- **Visão por Cluster: Tabela primeira coluna os Clusters, depois mosstrar o mês e embaixo do nome do mês 5 colunas na tabela. As 5 colunas são: <4horas,>4horas, % Dentro(<4 horas / total), Total e TMR.
- **Calculo: Nessa consulta do banco a tabela tem uma coluna que se chama tqi_codigo que vai se repetir várias vezes o código, cada vez que repete é uma vida do codigo. A coluna tmr_total calcula o tempo em horas de cada vdi_codigo.
Ou seja, preciso saber o tempo total do tqi_codigo conforme o que preciso.