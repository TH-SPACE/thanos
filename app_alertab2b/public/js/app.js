/**
 * Alerta B2B - Aplicação Frontend
 * Responsável por buscar e exibir os dados do backlog
 */

// Configurações
const API_BASE = '/alerta-b2b';
const LIMITE_PAGINA = 50;

// Estado da aplicação
let estadoAtual = {
    pagina: 1,
    totalPaginas: 1,
    totalRegistros: 0,
    filtros: {}
};

// ===========================================
// Inicialização
// ===========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Iniciando Alerta B2B...');
    carregarEstatisticas();
    carregarDados();
    configurarEventListeners();
    atualizarUltimaAtualizacao();
});

// ===========================================
// Configurar Event Listeners
// ===========================================
function configurarEventListeners() {
    // Botão de sincronizar
    document.getElementById('btnSincronizar').addEventListener('click', sincronizarDados);

    // Botão de filtrar
    document.getElementById('btnFiltrar').addEventListener('click', () => {
        estadoAtual.pagina = 1;
        carregarDados();
    });

    // Botão de limpar filtros
    document.getElementById('btnLimparFiltros').addEventListener('click', limparFiltros);

    // Botão de logs
    document.getElementById('btnLogs').addEventListener('click', abrirModalLogs);

    // Botão de dashboard
    document.getElementById('btnDashboard').addEventListener('click', abrirModalDashboard);

    // Enter nos inputs de texto
    document.querySelectorAll('.filter-group input').forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                estadoAtual.pagina = 1;
                carregarDados();
            }
        });
    });
}

// ===========================================
// Sincronização
// ===========================================
async function sincronizarDados() {
    const btn = document.getElementById('btnSincronizar');
    btn.disabled = true;
    btn.innerHTML = '⏳ Sincronizando...';

    try {
        const response = await fetch(`${API_BASE}/sincronizar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fonte: 'arquivo' })
        });

        const resultado = await response.json();

        if (resultado.success) {
            mostrarMensagem(`✅ Sincronização concluída! ${resultado.dados.total} registros processados.`, 'success');
            carregarEstatisticas();
            carregarDados();
            atualizarUltimaAtualizacao();
        } else {
            mostrarMensagem(`❌ Erro: ${resultado.error}`, 'error');
        }
    } catch (error) {
        mostrarMensagem(`❌ Erro ao sincronizar: ${error.message}`, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '🔄 Sincronizar';
    }
}

// ===========================================
// Carregar Estatísticas
// ===========================================
async function carregarEstatisticas(filtros = {}) {
    try {
        const params = new URLSearchParams(filtros);
        const response = await fetch(`${API_BASE}/estatisticas?${params}`);
        const resultado = await response.json();

        if (resultado.success) {
            const dados = resultado.dados.geral;
            
            console.log('Estatísticas recebidas:', dados);
            
            document.getElementById('statTotal').textContent = formatarNumero(dados.total_registros || 0);
            document.getElementById('statAtivos').textContent = formatarNumero(dados.ativos || 0);
            document.getElementById('statParados').textContent = formatarNumero(dados.parados || 0);
            document.getElementById('statClientes').textContent = formatarNumero(dados.total_clientes || 0);
            document.getElementById('statRegionais').textContent = formatarNumero(dados.total_regionais || 0);
        } else {
            console.error('Erro na resposta da API:', resultado);
        }
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
    }
}

// ===========================================
// Carregar Dados da Tabela
// ===========================================
async function carregarDados() {
    const tbody = document.getElementById('tabelaBody');
    tbody.innerHTML = '<tr><td colspan="10" class="loading"><div class="spinner"></div></td></tr>';

    const filtros = coletarFiltros();
    estadoAtual.filtros = filtros;

    try {
        const params = new URLSearchParams({
            pagina: estadoAtual.pagina,
            limite: LIMITE_PAGINA,
            ...filtros
        });

        const response = await fetch(`${API_BASE}/backlog?${params}`);
        const resultado = await response.json();

        if (resultado.success) {
            estadoAtual.totalRegistros = resultado.paginacao.total;
            estadoAtual.totalPaginas = resultado.paginacao.totalPaginas;

            if (resultado.dados.length === 0) {
                tbody.innerHTML = '<tr><td colspan="10" class="no-data">Nenhum registro encontrado</td></tr>';
            } else {
                tbody.innerHTML = '';
                resultado.dados.forEach(item => {
                    const tr = criarLinhaTabela(item);
                    tbody.appendChild(tr);
                });
            }

            atualizarInfoTabela();
            renderizarPaginacao();
            
            // Atualizar estatísticas com os filtros aplicados
            carregarEstatisticas(filtros);
        } else {
            tbody.innerHTML = '<tr><td colspan="10" class="no-data">Erro ao carregar dados</td></tr>';
        }
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        tbody.innerHTML = '<tr><td colspan="10" class="no-data">Erro ao carregar dados</td></tr>';
    }
}

// ===========================================
// Coletar Filtros
// ===========================================
function coletarFiltros() {
    const filtros = {};

    const bd = document.getElementById('filtroBD').value.trim();
    if (bd) filtros.bd = bd;

    const cliente = document.getElementById('filtroCliente').value.trim();
    if (cliente) filtros.cliente = cliente;

    const regional = document.getElementById('filtroRegional').value.trim();
    if (regional) filtros.regional = regional;

    const cluster = document.getElementById('filtroCluster').value.trim();
    if (cluster) filtros.cluster = cluster;

    const status = document.getElementById('filtroStatus').value.trim();
    if (status) filtros.status = status;

    const grupo = document.getElementById('filtroGrupo').value.trim();
    if (grupo) filtros.grupo = grupo;

    const dataInicio = document.getElementById('filtroDataInicio').value;
    if (dataInicio) filtros.dataInicio = dataInicio;

    const dataFim = document.getElementById('filtroDataFim').value;
    if (dataFim) filtros.dataFim = dataFim;

    return filtros;
}

// ===========================================
// Limpar Filtros
// ===========================================
function limparFiltros() {
    document.getElementById('filtroBD').value = '';
    document.getElementById('filtroCliente').value = '';
    document.getElementById('filtroRegional').value = '';
    document.getElementById('filtroCluster').value = '';
    document.getElementById('filtroStatus').value = '';
    document.getElementById('filtroGrupo').value = '';
    document.getElementById('filtroDataInicio').value = '';
    document.getElementById('filtroDataFim').value = '';

    estadoAtual.pagina = 1;
    carregarDados();
}

// ===========================================
// Criar Linha da Tabela
// ===========================================
function criarLinhaTabela(item) {
    const tr = document.createElement('tr');
    tr.addEventListener('click', () => mostrarDetalhes(item));

    const statusClass = item.status === 'Ativo' ? 'status-ativo' : 'status-parado';
    const statusBadge = `<span class="status-badge ${statusClass}">${item.status || 'N/A'}</span>`;

    tr.innerHTML = `
        <td><strong>${item.bd || '-'}</strong></td>
        <td>${item.nome_cliente || '-'}</td>
        <td>${item.regional || '-'}</td>
        <td>${statusBadge}</td>
        <td>${item.grupo || '-'}</td>
        <td>${item.procedencia || '-'}</td>
        <td>${item.sla ? formatarSLA(item.sla) : '-'}</td>
        <td>${item.prazo ? formatarPrazo(item.prazo) : '-'}</td>
        <td>${formatarData(item.last_update)}</td>
    `;

    return tr;
}

// ===========================================
// Mostrar Detalhes no Modal
// ===========================================
function mostrarDetalhes(item) {
    const modal = document.getElementById('modalDetalhes');
    const modalBody = document.getElementById('modalBody');

    modalBody.innerHTML = `
        <div class="details-grid">
            ${criarDetalheItem('BD', item.bd)}
            ${criarDetalheItem('Cliente', item.nome_cliente)}
            ${criarDetalheItem('Grupo', item.grupo)}
            ${criarDetalheItem('Regional', item.regional)}
            ${criarDetalheItem('Município', item.municipio)}
            ${criarDetalheItem('UF', item.uf)}
            ${criarDetalheItem('Status', item.status)}
            ${criarDetalheItem('Procedência', item.procedencia)}
            ${criarDetalheItem('Tipo Serviço', item.tipo_servico)}
            ${criarDetalheItem('SLA', item.sla ? formatarSLA(item.sla) : '-')}
            ${criarDetalheItem('Prazo', item.prazo ? formatarPrazo(item.prazo) : '-')}
            ${criarDetalheItem('Urgência', item.urgencia)}
            ${criarDetalheItem('Origem', item.origem)}
            ${criarDetalheItem('Reclamação', item.reclamacao)}
            ${criarDetalheItem('Data Criação', formatarData(item.data_criacao))}
            ${criarDetalheItem('Última Atualização', formatarData(item.last_update))}
            ${criarDetalheItem('Operadora', item.operadora)}
            ${criarDetalheItem('Segmento', item.segmento_cliente)}
            ${criarDetalheItem('Reincidência', item.reincidencia)}
        </div>
    `;

    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

// ===========================================
// Criar Item de Detalhe
// ===========================================
function criarDetalheItem(label, valor) {
    if (!valor || valor === 'null' || valor === 'undefined') return '';
    
    return `
        <div class="detail-item">
            <div class="detail-label">${label}</div>
            <div class="detail-value">${valor}</div>
        </div>
    `;
}

// ===========================================
// Fechar Modal
// ===========================================
function fecharModal() {
    const modal = document.getElementById('modalDetalhes');
    modal.classList.remove('show');
    document.body.style.overflow = '';
}

// Fechar modal ao clicar fora
window.onclick = function(event) {
    const modal = document.getElementById('modalDetalhes');
    if (event.target === modal) {
        fecharModal();
    }
}

// ===========================================
// Paginação
// ===========================================
function renderizarPaginacao() {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';

    if (estadoAtual.totalPaginas <= 1) return;

    // Botão Anterior
    const btnAnterior = document.createElement('button');
    btnAnterior.textContent = '← Anterior';
    btnAnterior.disabled = estadoAtual.pagina === 1;
    btnAnterior.addEventListener('click', () => {
        estadoAtual.pagina--;
        carregarDados();
    });
    pagination.appendChild(btnAnterior);

    // Números das páginas
    const paginaAtual = estadoAtual.pagina;
    const totalPaginas = estadoAtual.totalPaginas;
    
    let inicio = Math.max(1, paginaAtual - 2);
    let fim = Math.min(totalPaginas, paginaAtual + 2);

    if (inicio > 1) {
        criarBotaoPagina(1);
        if (inicio > 2) {
            pagination.innerHTML += '<span class="pagination-info">...</span>';
        }
    }

    for (let i = inicio; i <= fim; i++) {
        criarBotaoPagina(i);
    }

    if (fim < totalPaginas) {
        if (fim < totalPaginas - 1) {
            pagination.innerHTML += '<span class="pagination-info">...</span>';
        }
        criarBotaoPagina(totalPaginas);
    }

    // Botão Próxima
    const btnProxima = document.createElement('button');
    btnProxima.textContent = 'Próxima →';
    btnProxima.disabled = estadoAtual.pagina === totalPaginas;
    btnProxima.addEventListener('click', () => {
        estadoAtual.pagina++;
        carregarDados();
    });
    pagination.appendChild(btnProxima);

    function criarBotaoPagina(num) {
        const btn = document.createElement('button');
        btn.textContent = num;
        btn.disabled = num === estadoAtual.pagina;
        if (num === estadoAtual.pagina) {
            btn.classList.add('active');
        }
        btn.addEventListener('click', () => {
            estadoAtual.pagina = num;
            carregarDados();
        });
        pagination.appendChild(btn);
    }
}

// ===========================================
// Atualizar Informações da Tabela
// ===========================================
function atualizarInfoTabela() {
    const info = document.getElementById('tableInfo');
    const inicio = (estadoAtual.pagina - 1) * LIMITE_PAGINA + 1;
    const fim = Math.min(estadoAtual.pagina * LIMITE_PAGINA, estadoAtual.totalRegistros);
    
    info.textContent = `Mostrando ${inicio}-${fim} de ${formatarNumero(estadoAtual.totalRegistros)} registros`;
}

// ===========================================
// Atualizar Última Atualização
// ===========================================
function atualizarUltimaAtualizacao() {
    const now = new Date();
    const formatted = now.toLocaleString('pt-BR');
    document.getElementById('lastUpdate').textContent = formatted;
}

// ===========================================
// Utilitários
// ===========================================
function formatarNumero(num) {
    return num.toLocaleString('pt-BR');
}

function formatarSLA(sla) {
    return `${parseFloat(sla).toFixed(2)}h`;
}

function formatarPrazo(prazo) {
    return `${parseFloat(prazo).toFixed(2)} dias`;
}

function formatarData(data) {
    if (!data) return '-';
    const date = new Date(data);
    return date.toLocaleString('pt-BR');
}

function mostrarMensagem(mensagem, tipo) {
    // Remove mensagens anteriores
    const msgAnterior = document.querySelector('.success-message, .error-message');
    if (msgAnterior) msgAnterior.remove();

    const msgDiv = document.createElement('div');
    msgDiv.className = `${tipo}-message`;
    msgDiv.textContent = mensagem;

    const container = document.querySelector('.container');
    container.insertBefore(msgDiv, container.firstChild);

    setTimeout(() => {
        msgDiv.remove();
    }, 5000);
}
