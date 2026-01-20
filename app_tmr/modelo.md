DESCRIÇÃO DOS CAMPOS E REGRAS DOS INDICADORES
B2B AVANÇADO

Procência dos Reparos:
PREVENTIVO: VIVO ABRE O CHAMADO SEM O SERVIÇO DO CLIENTE ESTAR FORA - CHAMADO ABERTO PARA MELHORIA DO CLIENTE ENQUANTO ELE NÃO ESTA COM O SERVIÇO AFETADO
PROATIVO: VIVO ABRE O CHAMADO PARA REPARAR UM SERVIÇO FORA - A FALHA É IDENTIFICADA ANTES DO CLIENTE
REATIVO: CLIENTE ABRE O CHAMADO COM O SERVIÇO FORA - O BD TRIAGEM SE NÃO FOR RESOLVIDO NA TRIAGEM VIRA AUTOMATICAMENTE REATIVO
TRIAGEM: CLIENTE ABRE O CHAMADO COM O SERVIÇO FORA, PORÉM A RETENÇÃO OCORRE NA CÉLULA DE TRIAGEM


KPIs:
Os tipos de BDs são classificados de acordo com a visão e o conceito aplicado ao tratamento dos indicadores.
O KPI, na visão sem expurgo, contempla os BDs considerados no indicador oficial, estando alinhados com o Pós‑Vendas.
O EXP_SLM_CLIENTE, também na visão sem expurgo, refere‑se a expurgos associados à causa cliente, aplicáveis aos clientes que recebem relatório de performance, conforme critério solicitado por Alex Salgado.
O EXP_ENERGIA_CLIENTE enquadra‑se como sem expurgo e trata de expurgos relacionados à falta de energia no cliente, quando não há retenção no atendimento. Esse tema ainda está com alinhamento pendente junto ao Pós‑Vendas.
O EXP_LM, igualmente sem expurgo, corresponde a expurgos relacionados à última milha de terceiros, com alinhamento pendente junto ao Pós‑Vendas.
O EXP_SEDUC é classificado como sem expurgo e abrange expurgos relacionados à Secretaria Municipal de Educação, com causa atribuída ao cliente e sem fluxo de retenção.
O EXP_SISTEMAS_CLIENTE, na visão sem expurgo, refere‑se a expurgos por causa cliente para BDs que não passam pelo atendimento, não possuindo fluxo de retenção.
Já os tipos a seguir estão na visão com expurgo. O EXP_BLACKLIST contempla o expurgo de BDs referentes a circuitos condenados, sem ação de melhoria. Seu uso é restrito e deve ser sempre validado com o time de Qualidade.
O EXP_PREVENTIVA refere‑se a BDs associados à manutenção preventiva, sem afetação de serviço e que não impedem a abertura de outro BD.
O EXP_PROATIVO_CLIENTE engloba BDs abertos proativamente pela Vivo, porém causados pelo cliente.
O EXP_TRIAGEM diz respeito a BDs encerrados ainda na etapa de triagem.
O EXP_TLF contempla links de uso próprio.
O EXP_REDUNDANCIA trata de BDs abertos para atuação em alça de proteção.
O EXP_INDEVIDO_CRM_V2 refere‑se a BDs abertos indevidamente pelo atendimento e posteriormente cancelados pela própria equipe.
O EXP_SERVICE_DESK abrange serviços de configuração de produtos, não relacionados a reparo.
O EXP_PROJ_EFICIENCIA não é utilizado atualmente e está indicado para limpeza de código.
O EXP_SIP_PABX contempla expurgos relacionados a problemas no PABX Vivo, não aplicáveis para a Anatel.
O EXP_SOLUCOES_DIGITAL refere‑se a expurgos relacionados a problemas em produtos de soluções digitais, como notebooks e impressoras, também não aplicáveis para a Anatel.
O EXP_INDEVIDO_CRM_V1 trata de BDs abertos indevidamente pelo atendimento para clientes com bloqueio parcial.
O EXP_RESIDENCIAL contempla casos de cliente pessoa física com abertura indevida de BD.
O EXP_PROATIVO_ABERTO refere‑se ao expurgo de BDs proativos enquanto permanecem abertos, gerando impacto nas projeções diárias, especialmente às segundas‑feiras.
Por fim, o EXP_PROJ_GRECIA contempla BDs abertos pelo Projeto Grécia.

Regras dos Indicadores:

1) IRR% – Reincidência em 30 dias

Fórmula:
IRR% = (Contagem de BDs Repetidos) / (Contagem Total de BDs)


Janela de análise: 30 dias.
Marco de data: Data de Abertura.
Observação: No IRR% são considerados apenas os BDs fechados e baixados.


2) IRT% – Defeito por Planta

Fórmula:
IRT% = (Contagem de BDs) / (Contagem Planta)


Marco de data: Data de Abertura.

Cálculo do IRT% para o mês atual
Como não temos a planta fragmentada por dia, o IRT% do mês atual é calculado com projeção:

Divide‑se o volume de BDs pela planta e o resultado é dividido pela projeção até o dia atual.


Em outras palavras: para o mês corrente, a base “planta” é estimada (projetada) até a data de hoje para manter consistência do denominador.


3) TMR – Tempo Médio de Reparo

Fórmula:
TMR = (Soma dos TMRs) / (Contagem de BDs)


Marco de data: Data de Encerramento.

Definições de Tempo

TMR Expediente: considera o tempo entre Data/Hora de Abertura e Data/Hora de Baixa, apenas dentro do expediente do cliente (descontando períodos fora do horário de atendimento do cliente).


4) TRC% – Reparo no Prazo

Fórmula:
TRC% = (Contagem de BDs dentro do Prazo) / (Contagem Total de BDs)


Marco de data: Data de Encerramento.

Regras de Prazo


Prazo (geral):
Reparo dentro do prazo vinculado ao TMR_SEM PRAZO (Vivo 1: DSP 4HSE e FSP 6HRS).


Prazo Expediente:
Reparo dentro do prazo vinculado ao TMR_EXP
(Vivo 1: DSP 4HSE e FSP 6HRS; Vivo 2: considera‑se 6 horas).



“DSP” e “FSP” seguem as janelas contratuais definidas por tipo de atendimento. “HSE” significa horas em expediente.


Observações gerais

Quando a regra menciona Data de Abertura, significa que a classificação e contagem do indicador usam o timestamp de abertura do BD.
Quando menciona Data de Encerramento, usa‑se o timestamp de baixa/fechamento do BD.
Para mês corrente, indicadores que dependem da planta usam projeção até o dia atual para evitar subdimensionamento do denominador.
O TMR Expediente e o Prazo Expediente consideram apenas o período dentro do horário de funcionamento do cliente.
Horário de funcionamento em branco: considerar 08h às 18h (padrão).

