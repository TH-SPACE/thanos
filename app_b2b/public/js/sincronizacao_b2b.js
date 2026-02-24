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
