// ===========================================
// Configurações
// ===========================================
const API_BASE = '/alerta-b2b';

// ===========================================
// Inicialização
// ===========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Iniciando Dashboard Alerta B2B...');
    carregarFiltrosDropdowns();
    carregarEstatisticas();
    carregarStatusPorCluster();
    configurarEventListeners();
    atualizarUltimaAtualizacao();
});

// ===========================================
// Configurar Event Listeners
// ===========================================
function configurarEventListeners() {
    document.getElementById('btnAtualizar').addEventListener('click', () => {
        carregarEstatisticas();
        carregarStatusPorCluster();
    });

    document.getElementById('btnFiltrar').addEventListener('click', () => {
        carregarEstatisticas();
        carregarStatusPorCluster();
    });

    document.getElementById('btnLimpar').addEventListener('click', limparFiltros);
}

// ===========================================
// Coletar Filtros
// ===========================================
function coletarFiltros() {
    const filtros = {};

    const regional = document.getElementById('filtroRegional').value.trim();
    if (regional) filtros.regional = regional;

    const cluster = document.getElementById('filtroCluster').value.trim();
    if (cluster) filtros.cluster = cluster;

    const status = document.getElementById('filtroStatus').value.trim();
    if (status) filtros.status = status;

    return filtros;
}

// ===========================================
// Limpar Filtros
// ===========================================
function limparFiltros() {
    document.getElementById('filtroRegional').value = '';
    document.getElementById('filtroCluster').value = '';
    document.getElementById('filtroStatus').value = '';

    carregarEstatisticas();
    carregarStatusPorCluster();
}

// ===========================================
// Carregar Filtros Dropdowns
// ===========================================
async function carregarFiltrosDropdowns() {
    try {
        const response = await fetch(`${API_BASE}/filtros`);
        const resultado = await response.json();

        if (resultado.success) {
            const { regionais, clusters, status } = resultado.dados;

            // Preencher Regional
            const selectRegional = document.getElementById('filtroRegional');
            selectRegional.innerHTML = '<option value="">Todas</option>';
            regionais.forEach(regional => {
                const option = document.createElement('option');
                option.value = regional;
                option.textContent = regional;
                selectRegional.appendChild(option);
            });

            // Preencher Cluster
            const selectCluster = document.getElementById('filtroCluster');
            selectCluster.innerHTML = '<option value="">Todos</option>';
            clusters.forEach(cluster => {
                const option = document.createElement('option');
                option.value = cluster;
                option.textContent = cluster;
                selectCluster.appendChild(option);
            });

            // Preencher Status
            const selectStatus = document.getElementById('filtroStatus');
            selectStatus.innerHTML = '<option value="">Todos</option>';
            status.forEach(statusItem => {
                const option = document.createElement('option');
                option.value = statusItem;
                option.textContent = statusItem;
                selectStatus.appendChild(option);
            });

            console.log('✅ Filtros carregados:', { 
                regionais: regionais.length, 
                clusters: clusters.length, 
                status: status.length 
            });
        }
    } catch (error) {
        console.error('Erro ao buscar filtros:', error);
    }
}

// ===========================================
// Carregar Estatísticas
// ===========================================
async function carregarEstatisticas() {
    try {
        const filtros = coletarFiltros();
        const filtrosValidos = {};
        for (const [chave, valor] of Object.entries(filtros)) {
            if (valor && valor.trim() !== '') {
                filtrosValidos[chave] = valor;
            }
        }

        const params = new URLSearchParams(filtrosValidos);
        const response = await fetch(`${API_BASE}/estatisticas?${params}`);
        const resultado = await response.json();

        if (resultado.success) {
            const dados = resultado.dados.geral;

            document.getElementById('statTotal').textContent = formatarNumero(dados.total_registros || 0);
            document.getElementById('statAtivos').textContent = formatarNumero(dados.ativos || 0);
            document.getElementById('statParados').textContent = formatarNumero(dados.parados || 0);
            document.getElementById('statClientes').textContent = formatarNumero(dados.total_clientes || 0);
            document.getElementById('statRegionais').textContent = formatarNumero(dados.total_regionais || 0);
        }
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
    }
}

// ===========================================
// Carregar Status por Cluster
// ===========================================
async function carregarStatusPorCluster() {
    try {
        const filtros = coletarFiltros();
        const filtrosValidos = {};
        for (const [chave, valor] of Object.entries(filtros)) {
            if (valor && valor.trim() !== '') {
                filtrosValidos[chave] = valor;
            }
        }

        const params = new URLSearchParams(filtrosValidos);
        const response = await fetch(`${API_BASE}/status-por-cluster?${params}`);
        const resultado = await response.json();

        if (resultado.success) {
            const tbody = document.getElementById('tabelaStatusBody');
            tbody.innerHTML = '';

            resultado.dados.forEach(item => {
                const tr = document.createElement('tr');
                const percentualAtivos = item.total > 0 ? ((item.ativos / item.total) * 100).toFixed(1) : 0;
                const percentualParados = item.total > 0 ? ((item.parados / item.total) * 100).toFixed(1) : 0;

                tr.innerHTML = `
                    <td><strong>${item.cluster}</strong></td>
                    <td>${formatarNumero(item.total)}</td>
                    <td><span class="status-badge status-ativo">${formatarNumero(item.ativos)}</span></td>
                    <td><span class="status-badge status-parado">${formatarNumero(item.parados)}</span></td>
                    <td>
                        <div class="progress-bar">
                            <div class="progress-fill progress-ativo" style="width: ${percentualAtivos}%"></div>
                            <span class="progress-text">${percentualAtivos}%</span>
                        </div>
                    </td>
                    <td>
                        <div class="progress-bar">
                            <div class="progress-fill progress-parado" style="width: ${percentualParados}%"></div>
                            <span class="progress-text">${percentualParados}%</span>
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (error) {
        console.error('Erro ao carregar status por cluster:', error);
    }
}

// ===========================================
// Utilitários
// ===========================================
function formatarNumero(num) {
    return num.toString().replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function atualizarUltimaAtualizacao() {
    const agora = new Date();
    const horas = agora.getHours().toString().padStart(2, '0');
    const minutos = agora.getMinutes().toString().padStart(2, '0');
    const segundos = agora.getSeconds().toString().padStart(2, '0');
    document.getElementById('ultimaAtualizacao').textContent = `${horas}:${minutos}:${segundos}`;
}

// Atualizar relógio a cada segundo
setInterval(atualizarUltimaAtualizacao, 1000);
