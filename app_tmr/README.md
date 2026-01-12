nãon# Sistema de Cálculo de TMR (Tempo Médio de Reparos)

## Descrição

Sistema web para calcular o tempo médio dos reparos B2B, com interface para visualização por cluster e regional. O sistema integra-se com bases de dados Oracle e MariaDB para fornecer métricas atualizadas sobre o desempenho de reparos técnicos.

## Funcionalidades

### Acesso à Página
- Acessar a `b2btmr.html` pelo endpoint `/tmr`
- Requer login, semelhante ao app_he
- Interface responsiva com navegação intuitiva

### Transferência de Base
- Consulta SQL Oracle: realiza consulta dos últimos 3 meses conforme a lógica implementada
- Salva consulta no banco MariaDB na tabela `reparos_b2b_tmr`
- Rotina: executa a consulta e salvamento no banco a cada 12 horas automaticamente
- Possibilidade de sincronização manual através da interface

### Página Principal
- Filtro por Grupo: filtro por grupo (`grupo_agrupado`) nas abas de Cluster e Regional
- Filtro por Regional: filtro por regional disponível na aba de Cluster
- Filtro por Procedência: multisseleção de procedências (reativo, proativo, etc.) disponível na aba de Cluster
- Página com abas: Primeira aba com visão por Cluster, segunda por Regional
- Visão por Cluster: Tabela com clusters, mostrando os meses e 5 colunas com informações: <4horas, >4horas, % Dentro(<4 horas / total), Total e TMR
- Visão por Regional: Tabela com regionais, mostrando os meses e 5 colunas com informações: <4horas, >4horas, % Dentro(<4 horas / total), Total e TMR
- Cálculo: Baseado na coluna `tqi_codigo` que se repete várias vezes (cada repetição é uma vida do código) e na coluna `tmr_total` que calcula o tempo em horas
- Gráficos interativos: Visualização de total de reparos e TMR médio por mês na visão por cluster

### Funcionalidades Recentes
- **Filtro por Grupo**: Adicionado filtro por grupo (`grupo_agrupado`) nas abas de Cluster e Regional. O filtro é aplicado no backend antes do agrupamento por `tqi_codigo`.
- **Filtro por Regional**: Implementado filtro por regional na aba de Cluster.
- **Filtro por Procedência**: Implementado filtro multisseleção por procedência na aba de Cluster.
- **Cálculo por Mês**: Corrigido cálculo do TMR para considerar apenas o tempo do reparo no mês específico, não o tempo acumulado.
- **Contagem por Mês**: Reparos são contabilizados em todos os meses em que têm vidas, não apenas no mês da primeira vida.
- **Listagem Completa de Grupos**: O dropdown de grupos mostra todos os grupos disponíveis mesmo após aplicar um filtro.
- **Gráficos Interativos**: Adicionado gráfico de barras e linha dupla para visualização de total de reparos e TMR médio por mês.
- **Sincronização Manual**: Botão para sincronização manual de dados do Oracle para o MariaDB.
- **Atualização Dinâmica**: Atualização automática dos dados e filtros sem recarregar a página.

## Estrutura de Pastas

```
app_tmr/
├── controllers/           # Controladores para as rotas
│   ├── tmrController.js   # Controlador principal do TMR
│   └── dadosTmrController.js # Controlador para dados do Oracle
├── middleware/            # Middleware de autenticação
│   └── tmrAuth.js         # Middleware de autenticação para TMR
├── public/                # Arquivos estáticos (CSS, JS)
│   ├── css/
│   │   └── tmr-custom.css # Estilos customizados para o TMR
│   └── js/
│       └── tmr.js         # Scripts JavaScript para funcionalidades do TMR
├── routes/                # Definições de rotas
│   └── tmrRoutes.js       # Rotas específicas do TMR
├── services/              # Serviços de backend
│   └── tmrSyncService.js  # Serviço de sincronização de dados
├── utils/                 # Utilitários
│   └── dateUtils.js       # Funções para manipulação de datas
├── views/                 # Templates HTML
│   └── b2btmr.html        # Página principal do TMR
├── initTmrSync.js         # Arquivo para inicializar o serviço de sincronização
└── README.md              # Documentação do sistema
```

## Tecnologias Utilizadas

### Backend
- **Node.js**: Ambiente de execução JavaScript server-side
- **Express.js**: Framework web para criação de rotas e middleware
- **MySQL2**: Cliente MySQL para Node.js (utilizado para conexão com MariaDB)
- **OracleDB**: Cliente Oracle para Node.js (utilizado para conexão com Oracle)
- **Dotenv**: Gerenciamento de variáveis de ambiente

### Frontend
- **Bootstrap 5**: Framework CSS para layout responsivo
- **jQuery**: Biblioteca JavaScript para manipulação do DOM
- **Chart.js**: Biblioteca para criação de gráficos interativos
- **Font Awesome**: Biblioteca de ícones

### Banco de Dados
- **MariaDB**: Banco de dados relacional para armazenamento local
- **Oracle**: Banco de dados corporativo para obtenção de dados originais

## Configurações Necessárias

### Variáveis de Ambiente
Configure as seguintes variáveis no arquivo `.env`:

```env
# Configurações do MariaDB
DB_HOST=localhost
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_NAME=nome_do_banco

# Configurações do Oracle
ORACLE_DB_USER=seu_usuario_oracle
ORACLE_DB_PASSWORD=sua_senha_oracle
ORACLE_DB_HOST=endereco_do_host
ORACLE_DB_NAME=nome_do_servico
```

### Tabela no Banco de Dados
Execute o script de criação da tabela `reparos_b2b_tmr` no banco MariaDB. A estrutura da tabela deve conter os campos necessários para armazenar os dados de reparos B2B, incluindo:

- mes_inicio
- vdi_codigo
- tqi_codigo
- tqi_raiz
- id_circuito
- status_vida
- status_reparo
- procedencia
- produto
- origem
- cidade
- uf
- estado
- endereco
- tipo_cidade
- regional
- nom_cluster
- nome_cliente
- grp_codigo
- grupo_agrupado (preenchido automaticamente com base em regras definidas no arquivo grupo_agrupado_mapping.json)
- grupo_baixa
- tqi_diagnostico
- dgn_descricao
- tqi_abertura
- tqi_encerramento
- vdi_data_inicio
- vdi_data_fim
- tmr_total

## Instalação e Execução

### Pré-requisitos
- Node.js (versão 14 ou superior)
- MariaDB
- Acesso ao banco de dados Oracle

### Passos para Instalação

1. Certifique-se de ter as dependências do projeto principal instaladas:
   ```bash
   cd C:\sgq-app
   npm install
   ```

2. Configure as variáveis de ambiente no arquivo `.env` conforme descrito acima

3. Execute o script de criação da tabela `reparos_b2b_tmr` no banco MariaDB

4. Inicialize o serviço de sincronização de dados:
   ```bash
   node app_tmr/initTmrSync.js
   ```

5. Inicie o servidor principal do aplicativo

6. Acesse o sistema via rota `/tmr` após autenticação

## Uso do Sistema

### Autenticação
- O acesso ao sistema requer autenticação
- O sistema utiliza o mesmo mecanismo de login do app_he

### Navegação
- A interface principal está dividida em duas abas: "Visão por Cluster" e "Visão por Regional"
- Cada aba apresenta uma tabela com os dados correspondentes

### Filtros Disponíveis
- **Grupo**: Filtra os dados por grupo específico
- **Regional**: Filtra os dados por regional (disponível apenas na aba de Cluster)
- **Procedência**: Filtra os dados por tipo de procedência (multisseleção, disponível apenas na aba de Cluster)

### Interpretação dos Dados
- **<4h**: Quantidade de reparos concluídos em menos de 4 horas
- **>4h**: Quantidade de reparos concluídos em 4 horas ou mais
- **% Dentro**: Percentual de reparos concluídos em menos de 4 horas
- **Total**: Total de reparos no período
- **TMR**: Tempo Médio de Reparos em horas

### Sincronização de Dados
- O sistema sincroniza automaticamente os dados do Oracle para o MariaDB a cada 12 horas
- É possível realizar uma sincronização manual através do botão "Sincronizar Dados" na interface

## APIs Disponíveis

### GET /tmr
- Retorna a página principal do sistema TMR

### GET /tmr/data
- Retorna os dados de TMR com base nos filtros aplicados
- Parâmetros opcionais: `grupo`, `regional`, `procedencia`

### GET /tmr/grupos
- Retorna a lista de todos os grupos disponíveis

### GET /tmr/regionais
- Retorna a lista de todas as regionais disponíveis

### GET /tmr/procedencias
- Retorna a lista de todas as procedências disponíveis

### POST /tmr/sincronizar
- Realiza uma sincronização manual dos dados do Oracle para o MariaDB

### GET /tmr/dados/oracle-data
- Retorna os dados brutos do Oracle (requer autenticação)

## Arquitetura do Sistema

### Camada de Dados
- **Fonte Primária**: Banco de dados Oracle com dados históricos de reparos
- **Armazenamento Local**: MariaDB com dados sincronizados para consultas rápidas
- **Sincronização**: Processo automatizado que ocorre a cada 12 horas

### Camada de Serviço
- **tmrSyncService.js**: Responsável pela sincronização entre Oracle e MariaDB
- **dateUtils.js**: Utilitários para manipulação de datas entre diferentes formatos

### Camada de Apresentação
- **b2btmr.html**: Página principal com interface de usuário
- **tmr.js**: Lógica de apresentação e interação com a API
- **tmr-custom.css**: Estilos específicos para o sistema TMR

## Segurança

- Autenticação obrigatória para acesso às funcionalidades
- Validação de parâmetros nas requisições
- Uso de queries parametrizadas para prevenir SQL Injection
- Proteção contra acesso não autorizado às APIs

## Manutenção

### Monitoramento
- Verifique periodicamente os logs de sincronização
- Monitore a disponibilidade dos bancos de dados Oracle e MariaDB
- Verifique o funcionamento dos filtros e cálculos

### Atualizações
- Mantenha as dependências atualizadas
- Revise periodicamente as consultas SQL para otimização de performance
- Atualize as regras de negócio conforme necessidades do negócio

## Solução de Problemas

### Problemas Comuns
- **Falha na sincronização**: Verifique a conectividade com o banco Oracle e as credenciais
- **Dados ausentes**: Confirme se a sincronização foi executada com sucesso
- **Erros de autenticação**: Verifique se o usuário está autenticado corretamente

### Logs Importantes
- Verifique os logs do servidor para erros de sincronização
- Monitore os logs de banco de dados para problemas de conexão
- Verifique os logs do navegador para erros de interface

## Contribuição

Para contribuir com o desenvolvimento do sistema:

1. Faça um fork do repositório
2. Crie uma branch para sua feature (`git checkout -b feature/nome-da-feature`)
3. Commit suas alterações (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nome-da-feature`)
5. Abra um Pull Request

## Autores

Sistema desenvolvido conforme especificações do projeto SGQ.

## Licença

Este projeto está licenciado conforme os termos definidos pela organização.

## Agradecimentos

- Equipe de desenvolvimento do projeto SGQ
- Equipe de infraestrutura por manter os bancos de dados
- Usuários que forneceram feedback valioso para melhorias