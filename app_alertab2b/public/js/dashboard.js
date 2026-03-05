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
    carregarReparosCriticost();
    carregarEstatisticas();
    carregarDashboard();
    carregarStatusPorCluster();
    configurarEventListeners();
    atualizarUltimaAtualizacao();
});

// ===========================================
// Configurar Event Listeners
// ===========================================
function configurarEventListeners() {
    document.getElementById('btnAtualizar').addEventListener('click', () => {
        carregarReparosCriticost();
        carregarEstatisticas();
        carregarDashboard();
        carregarStatusPorCluster();
    });

    document.getElementById('btnFiltrar').addEventListener('click', () => {
        carregarReparosCriticost();
        carregarEstatisticas();
        carregarDashboard();
        carregarStatusPorCluster();
    });

    document.getElementById('btnLimpar').addEventListener('click', limparFiltros);

    document.getElementById('btnVerCriticost').addEventListener('click', () => {
        window.open('/alerta-b2b/?status=Ativo&urgente=true', '_blank');
    });

    document.getElementById('btnVerAtencao').addEventListener('click', () => {
        window.open('/alerta-b2b/?status=Ativo&atencao=true', '_blank');
    });
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
    
    carregarReparosCriticost();
    carregarEstatisticas();
    carregarDashboard();
    carregarStatusPorCluster();
}

// ===========================================
// Carregar Reparos Críticos
// ===========================================
async function carregarReparosCriticost() {
    try {
        const response = await fetch(`${API_BASE}/reparos-criticos`);
        const resultado = await response.json();

        if (resultado.success) {
            const resumo = resultado.dados.resumo;

            document.getElementById('alertUrgente').textContent = formatarNumero(resumo.urgente || 0);
            document.getElementById('alertAtencao').textContent = formatarNumero(resumo.atencao || 0);
            document.getElementById('alertAlerta').textContent = formatarNumero(resumo.alerta || 0);
            document.getElementById('alertMonitorar').textContent = formatarNumero(resumo.monitorar || 0);

            // Mostrar/esconder seção de alertas
            const alertSection = document.getElementById('alertSection');
            if (resumo.urgente === 0 && resumo.atencao === 0 && resumo.alerta === 0) {
                alertSection.style.display = 'none';
            } else {
                alertSection.style.display = 'block';
            }
        }
    } catch (error) {
        console.error('Erro ao carregar reparos críticos:', error);
    }
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
// Carregar Dashboard de Tempo de Backlog
// ===========================================
async function carregarDashboard() {
    try {
        const filtros = coletarFiltros();
        const filtrosValidos = {};
        for (const [chave, valor] of Object.entries(filtros)) {
            if (valor && valor.trim() !== '') {
                filtrosValidos[chave] = valor;
            }
        }

        const params = new URLSearchParams(filtrosValidos);
        const response = await fetch(`${API_BASE}/dashboard?${params}`);
        const resultado = await response.json();

        if (resultado.success) {
            const container = document.getElementById('dashboardBacklog');
            container.innerHTML = '';

            resultado.dados.forEach(cluster => {
                const card = criarCardCluster(cluster);
                container.appendChild(card);
            });
        }
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
    }
}

// ===========================================
// Criar Card de Cluster
// ===========================================
function criarCardCluster(cluster) {
    const card = document.createElement('div');
    card.className = 'cluster-card';

    const horas = cluster.tempo_horas || {};
    const dias = cluster.tempo_dias || {};

    card.innerHTML = `
        <div class="cluster-header">
            <h3>${cluster.cluster}</h3>
            <span class="cluster-total">${cluster.total} registros</span>
        </div>
        <div class="cluster-content">
            <div class="time-range">
                <div class="time-label">Horas</div>
                <div class="time-bars">
                    ${criarBarraTempo('< 1h', horas.menos_1h || 0, 'range-0-1')}
                    ${criarBarraTempo('1-3h', horas.1_3h || 0, 'range-1-3')}
                    ${criarBarraTempo('3-6h', horas.3_6h || 0, 'range-3-6')}
                    ${criarBarraTempo('6-8h', horas.6_8h || 0, 'range-6-8')}
                    ${criarBarraTempo('8-24h', horas.8_24h || 0, 'range-8-24')}
                </div>
            </div>
            <div class="time-range">
                <div class="time-label">Dias</div>
                <div class="time-bars">
                    ${criarBarraTempo('1-3d', dias.1_3d || 0, 'range-1-3d')}
                    ${criarBarraTempo('3-5d', dias.3_5d || 0, 'range-3-5d')}
                    ${criarBarraTempo('5-7d', dias.5_7d || 0, 'range-5-7d')}
                    ${criarBarraTempo('7-15d', dias.7_15d || 0, 'range-7-15d')}
                    ${criarBarraTempo('15-30d', dias.15_30d || 0, 'range-15-30d')}
                    ${criarBarraTempo('> 30d', dias.mais_30d || 0, 'range-mais-30d')}
                </div>
            </div>
        </div>
    `;

    return card;
}

// ===========================================
// Criar Barra de Tempo
// ===========================================
function criarBarraTempo(label, valor, classe) {
    return `
        <div class="time-bar ${classe}">
            <span class="bar-label">${label}</span>
            <div class="bar-container">
                <div class="bar" style="width: ${Math.min(valor * 5, 100)}%"></div>
            </div>
            <span class="bar-value">${valor}</span>
        </div>
    `;
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
