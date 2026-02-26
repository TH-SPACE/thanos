/**
 * Módulo de sincronização com API BDS
 * Responsável por buscar dados automaticamente do sistema externo
 */

// Função para atualizar visibilidade dos campos de data baseado no tipo de busca
function atualizarVisibilidadeDatas() {
    const tipoData = document.getElementById('syncTipoData').value;
    const dataInicial = document.getElementById('syncDataInicial');
    const dataFinal = document.getElementById('syncDataFinal');
    const containerDatas = dataInicial?.closest('.row');

    // Para "buscaporabertos", esconder datas
    if (tipoData === 'buscaporabertos') {
        if (containerDatas) containerDatas.style.display = 'none';
        if (dataInicial) dataInicial.removeAttribute('required');
        if (dataFinal) dataFinal.removeAttribute('required');
    } else {
        if (containerDatas) containerDatas.style.display = '';
        if (dataInicial) dataInicial.setAttribute('required', 'required');
        if (dataFinal) dataFinal.setAttribute('required', 'required');
    }
}

// Função principal para sincronizar dados
function sincronizarDadosBDS() {
    // Obter filtros do modal
    let dataInicial = document.getElementById('syncDataInicial').value;
    let dataFinal = document.getElementById('syncDataFinal').value;
    const tipoData = document.getElementById('syncTipoData').value;

    // Para busca por abertos, não precisa de datas
    if (tipoData === 'buscaporabertos') {
        dataInicial = '';
        dataFinal = '';
    }

    // Obter regionais selecionadas
    const regionaisSelecionadas = Array.from(document.querySelectorAll('.sync-regional:checked'))
        .map(cb => cb.value);

    // KPIs: enviar todos fixos
    const todosKpis = [
        'KPI', 'EXP_DYING_GASP', 'EXP_TLF', 'EXP_SLM_CLIENTE', 'EXP_PREVENTIVA',
        'EXP_PROJ_EFICIENCIA', 'EXP_TRIAGEM', 'EXP_SEDUC', 'EXP_LM',
        'EXP_PROATIVO_CLIENTE', 'EXP_REDUNDANCIA', 'EXP_BLACKLIST', 'EXP_PROJ_GRECIA',
        'EXP_FUST', 'EXP_INDEVIDO_CRM_V1', 'EXP_SERVICE_DESK', 'EXP_INDEVIDO_CRM_V2',
        'EXP_SIP_PABX', 'EXP_SISTEMAS_CLIENTE', 'EXP_TPL', 'EXP_ROBO_EDUCACAO',
        'EXP_MASSIVA_ITX_VOZ_B2B', 'KPI_GESTAO_DE_REDES', 'EXP_PROATIVO_ABERTO'
    ];

    // Validar datas (exceto para busca por abertos)
    if (tipoData !== 'buscaporabertos' && (!dataInicial || !dataFinal)) {
        alert('⚠️ Por favor, selecione a data inicial e final!');
        return;
    }

    // Mensagem de confirmação personalizada
    let mensagemConfirmacao = `📊 Confirmar sincronização?\n\n`;
    
    if (tipoData === 'buscaporabertos') {
        mensagemConfirmacao += `Tipo: Apenas Abertos\n`;
    } else {
        mensagemConfirmacao += `Período: ${formatarDataBR(dataInicial)} até ${formatarDataBR(dataFinal)}\n`;
    }
    
    mensagemConfirmacao += `Tipo: ${tipoData}\n`;
    mensagemConfirmacao += `Regionais: ${regionaisSelecionadas.length || 'Todas'}\n`;
    mensagemConfirmacao += `KPIs: Todos (${todosKpis.length})\n\n`;
    mensagemConfirmacao += `Isso pode levar alguns minutos...`;

    // Confirmar sincronização
    const confirmacao = confirm(mensagemConfirmacao);

    if (!confirmacao) return;

    // Mostrar feedback visual
    mostrarFeedbackSincronizacao(true);

    // Fazer requisição para sincronizar
    fetch('/b2b/sincronizacao/sincronizar', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            regionais: regionaisSelecionadas,
            kpis: todosKpis,  // Enviar todos os KPIs
            dataInicial,
            dataFinal,
            tipoData,
            cliente: ''
        })
    })
    .then(response => response.json())
    .then(data => {
        mostrarFeedbackSincronizacao(false, data);

        if (data.success) {
            // Fechar modal após 2 segundos
            setTimeout(() => {
                const modal = bootstrap.Modal.getInstance(document.getElementById('modalSincronizacao'));
                if (modal) {
                    modal.hide();
                }
                // Atualizar a tabela
                if (typeof loadAnalysisData === 'function') {
                    loadAnalysisData();
                }
            }, 2000);
        }
    })
    .catch(error => {
        console.error('Erro na sincronização:', error);
        mostrarFeedbackSincronizacao(false, { success: false, error: 'Erro ao sincronizar dados' });
    });
}

// Função para formatar data no formato brasileiro
function formatarDataBR(dataISO) {
    if (!dataISO) return '';
    const [ano, mes, dia] = dataISO.split('-');
    return `${dia}/${mes}/${ano}`;
}

// Função para mostrar feedback visual durante a sincronização
function mostrarFeedbackSincronizacao(iniciando, dados = null) {
    const btnSincronizar = document.getElementById('btnSincronizarModal');
    const statusSincronizacao = document.getElementById('statusSincronizacao');

    if (!btnSincronizar) return;

    if (iniciando) {
        // Iniciando sincronização
        btnSincronizar.disabled = true;
        btnSincronizar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sincronizando...';
        btnSincronizar.classList.remove('btn-primary');
        btnSincronizar.classList.add('btn-warning');

        if (statusSincronizacao) {
            statusSincronizacao.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sincronizando dados... Aguarde.';
            statusSincronizacao.className = 'text-warning';
        }
    } else {
        // Sincronização concluída
        btnSincronizar.disabled = false;
        btnSincronizar.innerHTML = '<i class="fas fa-check"></i> Concluído!';

        if (dados && dados.success) {
            const mensagem = `${dados.inseridos || 0} inseridos, ${dados.atualizados || 0} atualizados`;
            if (statusSincronizacao) {
                statusSincronizacao.innerHTML = `<i class="fas fa-check-circle"></i> ${mensagem}`;
                statusSincronizacao.className = 'text-success';
            }

            // Restaurar botão após 3 segundos
            setTimeout(() => {
                btnSincronizar.innerHTML = '<i class="fas fa-cloud-download-alt"></i> Sincronizar BDS';
                btnSincronizar.classList.remove('btn-warning');
                btnSincronizar.classList.add('btn-primary');
            }, 3000);
        } else {
            const erro = dados?.error || 'Erro ao sincronizar';
            if (statusSincronizacao) {
                statusSincronizacao.innerHTML = `<i class="fas fa-times-circle"></i> ${erro}`;
                statusSincronizacao.className = 'text-danger';
            }

            // Restaurar botão após 3 segundos
            setTimeout(() => {
                btnSincronizar.innerHTML = '<i class="fas fa-cloud-download-alt"></i> Sincronizar BDS';
                btnSincronizar.classList.remove('btn-warning');
                btnSincronizar.classList.add('btn-primary');
            }, 3000);
        }
    }
}

// Função para selecionar/desmarcar todas as regionais
function toggleTodasRegionais() {
    const checkboxTodos = document.getElementById('syncRegionalTodos');
    const regionais = document.querySelectorAll('.sync-regional');

    regionais.forEach(regional => {
        regional.checked = checkboxTodos.checked;
    });
}

// Função para atualizar estado do "Todos" baseado nas regionais individuais
function atualizarTodasRegionais() {
    const checkboxTodos = document.getElementById('syncRegionalTodos');
    const regionais = document.querySelectorAll('.sync-regional');
    const regionaisMarcadas = document.querySelectorAll('.sync-regional:checked');

    checkboxTodos.checked = regionais.length === regionaisMarcadas.length;
}

// Função para carregar opções de regionais
function carregarOpcoesSincronizacao() {
    // Carregar regionais
    fetch('/b2b/sincronizacao/regionais')
        .then(response => response.json())
        .then(regionais => {
            const container = document.getElementById('syncRegionaisContainer');
            if (container && regionais.length > 0) {
                // Regionais que devem vir marcadas por padrão
                const regionaisPadrao = ['CENTRO-OESTE', 'NORTE'];
                
                container.innerHTML = `
                    <div class="form-check mb-2">
                        <input class="form-check-input" type="checkbox" id="syncRegionalTodos" onchange="toggleTodasRegionais()">
                        <label class="form-check-label" for="syncRegionalTodos">
                            <strong>Selecionar Todas</strong>
                        </label>
                    </div>
                    <hr class="my-1">
                    ${regionais.map(regional => {
                        const marcado = regionaisPadrao.includes(regional) ? 'checked' : '';
                        return `
                        <div class="form-check form-check-inline">
                            <input class="form-check-input sync-regional" type="checkbox" value="${regional}" id="sync_regional_${regional.replace(/\s+/g, '_')}" ${marcado} onchange="atualizarTodasRegionais()">
                            <label class="form-check-label" for="sync_regional_${regional.replace(/\s+/g, '_')}">${regional}</label>
                        </div>
                    `}).join('')}
                `;
                
                // Atualizar o checkbox "Todas" baseado nas regionais marcadas
                atualizarTodasRegionais();
            }
        })
        .catch(error => console.error('Erro ao carregar regionais:', error));
}

// Função para inicializar o modal de sincronização
function inicializarModalSincronizacao() {
    const modalElement = document.getElementById('modalSincronizacao');

    if (modalElement) {
        // Carregar opções quando o modal for aberto
        modalElement.addEventListener('show.bs.modal', function() {
            carregarOpcoesSincronizacao();

            // Definir datas padrão (últimos 30 dias)
            const hoje = new Date();
            const trintaDiasAtras = new Date(hoje);
            trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);

            document.getElementById('syncDataInicial').value = trintaDiasAtras.toISOString().slice(0, 10);
            document.getElementById('syncDataFinal').value = hoje.toISOString().slice(0, 10);
            
            // Configurar listener para mudar visibilidade das datas
            const tipoDataSelect = document.getElementById('syncTipoData');
            if (tipoDataSelect) {
                tipoDataSelect.addEventListener('change', atualizarVisibilidadeDatas);
            }
            
            // Chamar uma vez para configurar o estado inicial
            atualizarVisibilidadeDatas();
        });
    }

    // Inicializar botão de sincronizar do MODAL (não do header)
    // O botão do header usa data-bs-toggle="modal" e abre o modal diretamente
    const btnSincronizarModal = document.getElementById('btnSincronizarModal');
    if (btnSincronizarModal) {
        btnSincronizarModal.addEventListener('click', sincronizarDadosBDS);
    }
}

// Exportar funções para uso global
window.sincronizarDadosBDS = sincronizarDadosBDS;
window.inicializarModalSincronizacao = inicializarModalSincronizacao;
window.toggleTodasRegionais = toggleTodasRegionais;
window.atualizarTodasRegionais = atualizarTodasRegionais;
window.atualizarVisibilidadeDatas = atualizarVisibilidadeDatas;

/**
 * Módulo de Logs de Sincronização
 */

// Formatar tipo de sincronização
function formatarTipoSync(tipo) {
    const tipos = {
        'manual': '<span class="badge bg-primary"><i class="fas fa-hand-pointer"></i> Manual</span>',
        'automatico': '<span class="badge bg-info"><i class="fas fa-robot"></i> Automático</span>',
        'upload': '<span class="badge bg-success"><i class="fas fa-file-upload"></i> Upload</span>'
    };
    return tipos[tipo] || tipo;
}

// Formatar status
function formatarStatus(status) {
    const statusMap = {
        'sucesso': '<span class="badge bg-success"><i class="fas fa-check-circle"></i> Sucesso</span>',
        'parcial': '<span class="badge bg-warning text-dark"><i class="fas fa-exclamation-triangle"></i> Parcial</span>',
        'erro': '<span class="badge bg-danger"><i class="fas fa-times-circle"></i> Erro</span>'
    };
    return statusMap[status] || status;
}

// Formatar data/hora
function formatarDataHora(dataStr) {
    if (!dataStr) return '-';
    const data = new Date(dataStr);
    return data.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Formatar data apenas
function formatarData(dataStr) {
    if (!dataStr) return '-';
    const data = new Date(dataStr);
    return data.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Carregar resumo dos logs
async function carregarResumoLogs() {
    try {
        const response = await fetch('/b2b/sincronizacao/logs/resumo');
        const result = await response.json();

        const tbody = document.querySelector('#tabelaResumoLogs tbody');
        
        if (!result.success || !result.resumo || result.resumo.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center text-muted">
                        <i class="fas fa-info-circle"></i> Nenhum registro encontrado nos últimos 30 dias.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = result.resumo.map(log => `
            <tr>
                <td>${formatarData(log.data)}</td>
                <td>${formatarTipoSync(log.tipo_sync)}</td>
                <td class="text-center">${log.quantidade_syncs}</td>
                <td class="text-center">${log.total_inseridos || 0}</td>
                <td class="text-center">${log.total_atualizados || 0}</td>
                <td class="text-center">${log.total_erros || 0}</td>
                <td class="text-center">${log.total_processado || 0}</td>
                <td class="text-center">${log.duracao_media_segundos ? log.duracao_media_segundos + 's' : '-'}</td>
                <td class="text-center">
                    ${log.taxa_sucesso_percentual ? 
                        `<span class="badge ${log.taxa_sucesso_percentual >= 90 ? 'bg-success' : log.taxa_sucesso_percentual >= 70 ? 'bg-warning' : 'bg-danger'}">
                            ${log.taxa_sucesso_percentual}%
                        </span>` : 
                        '-'}
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Erro ao carregar resumo:', error);
        document.querySelector('#tabelaResumoLogs tbody').innerHTML = `
            <tr>
                <td colspan="9" class="text-center text-danger">
                    <i class="fas fa-exclamation-triangle"></i> Erro ao carregar resumo.
                </td>
            </tr>
        `;
    }
}

// Carregar últimas sincronizações
async function carregarUltimasLogs() {
    try {
        const response = await fetch('/b2b/sincronizacao/logs?limite=50');
        const result = await response.json();

        const tbody = document.querySelector('#tabelaUltimasLogs tbody');
        
        if (!result.success || !result.logs || result.logs.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center text-muted">
                        <i class="fas fa-info-circle"></i> Nenhum registro encontrado.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = result.logs.map(log => `
            <tr>
                <td>${formatarDataHora(log.data_sync)}</td>
                <td>${formatarTipoSync(log.tipo_sync)}</td>
                <td>${formatarStatus(log.status_sync)}</td>
                <td class="text-center">${log.total_registros}</td>
                <td class="text-center">${log.registros_inseridos}</td>
                <td class="text-center">${log.registros_atualizados}</td>
                <td class="text-center">${log.registros_erro}</td>
                <td class="text-center">${log.duracao_segundos ? log.duracao_segundos + 's' : '-'}</td>
                <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${log.mensagem || ''}">
                    ${log.mensagem || '-'}
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Erro ao carregar logs:', error);
        document.querySelector('#tabelaUltimasLogs tbody').innerHTML = `
            <tr>
                <td colspan="9" class="text-center text-danger">
                    <i class="fas fa-exclamation-triangle"></i> Erro ao carregar logs.
                </td>
            </tr>
        `;
    }
}

// Carregar todos os logs (resumo + últimas)
async function carregarLogs() {
    await Promise.all([
        carregarResumoLogs(),
        carregarUltimasLogs()
    ]);
}

// Inicializar modal de logs
function inicializarModalLogs() {
    const modalLogs = document.getElementById('modalLogs');
    
    if (modalLogs) {
        modalLogs.addEventListener('shown.bs.modal', () => {
            carregarLogs();
        });
    }

    // Botão de atualizar logs
    const btnAtualizarLogs = document.getElementById('btnAtualizarLogs');
    if (btnAtualizarLogs) {
        btnAtualizarLogs.addEventListener('click', () => {
            carregarLogs();
        });
    }
}

// Exportar funções de logs
window.carregarLogs = carregarLogs;
window.carregarResumoLogs = carregarResumoLogs;
window.carregarUltimasLogs = carregarUltimasLogs;
window.inicializarModalLogs = inicializarModalLogs;
