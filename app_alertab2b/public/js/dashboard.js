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
    carregarTempoBacklog();
    configurarEventListeners();
    configurarMultiselect();
    atualizarUltimaAtualizacao();

    console.log('✅ Dashboard inicializado!');
});

// ===========================================
// Configurar Event Listeners
// ===========================================
function configurarEventListeners() {
    const btnFiltrar = document.getElementById('btnFiltrar');
    const btnLimpar = document.getElementById('btnLimpar');
    const btnSincronizar = document.getElementById('btnSincronizar');

    if (btnFiltrar) {
        btnFiltrar.onclick = (e) => {
            e.preventDefault();
            carregarEstatisticas();
            carregarStatusPorCluster();
            carregarTempoBacklog();
        };
    }

    if (btnLimpar) {
        btnLimpar.onclick = (e) => {
            e.preventDefault();
            limparFiltros();
        };
    }

    if (btnSincronizar) {
        btnSincronizar.onclick = (e) => {
            e.preventDefault();
            sincronizarDados();
        };
    }
}

// ===========================================
// Sincronizar Dados
// ===========================================
async function sincronizarDados() {
    const btnSincronizar = document.getElementById('btnSincronizar');
    const textoOriginal = btnSincronizar.innerHTML;

    try {
        btnSincronizar.disabled = true;
        btnSincronizar.innerHTML = '⏳ Baixando e sincronizando...';

        const response = await fetch(`${API_BASE}/sincronizar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ fonte: 'arquivo' })
        });

        const resultado = await response.json();

        if (resultado.success) {
            alert('✅ Sincronização realizada com sucesso!\n\n' +
                  `Registros inseridos: ${resultado.dados.inseridos}\n` +
                  `Filtrados (CO/Norte): ${resultado.dados.filtrados}\n` +
                  `Total processado: ${resultado.dados.total}`);

            // Recarregar dados
            carregarEstatisticas();
            carregarStatusPorCluster();
            carregarTempoBacklog();
        } else {
            alert('❌ Erro na sincronização:\n' + (resultado.error || resultado.message));
        }
    } catch (error) {
        console.error('Erro ao sincronizar:', error);
        alert('❌ Erro ao sincronizar:\n' + error.message);
    } finally {
        btnSincronizar.disabled = false;
        btnSincronizar.innerHTML = '🔄 Sincronizar';
    }
}

// ===========================================
// Configurar Multiselect
// ===========================================
function configurarMultiselect() {
    const header = document.getElementById('filtroProcedenciaHeader');
    const dropdown = document.getElementById('filtroProcedenciaDropdown');

    // Toggle dropdown
    header.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('show');
        header.classList.toggle('active');
        const arrow = header.querySelector('.multiselect-arrow');
        if (arrow) arrow.classList.toggle('rotate');
    });

    // Fechar ao clicar fora
    document.addEventListener('click', (e) => {
        if (!header.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.remove('show');
            header.classList.remove('active');
            const arrow = header.querySelector('.multiselect-arrow');
            if (arrow) arrow.classList.remove('rotate');
        }
    });

    // Prevenir fechamento ao clicar dentro do dropdown
    dropdown.addEventListener('click', (e) => {
        e.stopPropagation();
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

    // Coletar procedências selecionadas
    const procedenciasSelecionadas = getProcedenciasSelecionadas();
    console.log('📍 Procedências selecionadas:', procedenciasSelecionadas);
    if (procedenciasSelecionadas.length > 0) {
        filtros.procedencia = procedenciasSelecionadas.join(',');
    }

    console.log('📦 Filtros coletados:', filtros);
    return filtros;
}

// ===========================================
// Obter Procedências Selecionadas
// ===========================================
function getProcedenciasSelecionadas() {
    const dropdown = document.getElementById('filtroProcedenciaDropdown');
    if (!dropdown) {
        console.warn('⚠️ Dropdown de procedência não encontrado');
        return [];
    }
    
    const checkboxes = dropdown.querySelectorAll('input[type="checkbox"]:checked');
    console.log('✅ Checkboxes marcados:', checkboxes.length);
    return Array.from(checkboxes).map(cb => cb.value);
}

// ===========================================
// Atualizar Texto do Multiselect
// ===========================================
function atualizarTextoProcedencia() {
    const selecionadas = getProcedenciasSelecionadas();
    const placeholder = document.getElementById('filtroProcedenciaHeader')?.querySelector('.multiselect-placeholder');
    
    if (!placeholder) {
        return;
    }

    if (selecionadas.length === 0) {
        placeholder.textContent = 'Selecionar procedências...';
        placeholder.className = 'multiselect-placeholder';
    } else if (selecionadas.length <= 2) {
        placeholder.textContent = selecionadas.join(', ');
        placeholder.className = 'multiselect-selected-text';
    } else {
        placeholder.textContent = `${selecionadas.length} selecionadas`;
        placeholder.className = 'multiselect-selected-text';
    }
}

// ===========================================
// Limpar Filtros
// ===========================================
function limparFiltros() {
    document.getElementById('filtroRegional').value = '';
    document.getElementById('filtroCluster').value = '';

    // Desmarcar todas as procedências
    const checkboxes = document.querySelectorAll('#filtroProcedenciaDropdown input[type="checkbox"]');
    checkboxes.forEach(cb => {
        cb.checked = false;
        cb.closest('.multiselect-option')?.classList.remove('selected');
    });
    atualizarTextoProcedencia();

    carregarEstatisticas();
    carregarStatusPorCluster();
    carregarTempoBacklog();
}

// ===========================================
// Carregar Filtros Dropdowns
// ===========================================
async function carregarFiltrosDropdowns() {
    try {
        const response = await fetch(`${API_BASE}/filtros`);
        const resultado = await response.json();

        if (resultado.success) {
            const { regionais, clusters, procedencias } = resultado.dados;

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

            // Preencher Procedência (Multiselect)
            const dropdownProcedencia = document.getElementById('filtroProcedenciaDropdown');
            dropdownProcedencia.innerHTML = '';

            // Adicionar opções de procedência
            const procedenciasPadrao = ['PROATIVO', 'REATIVO'];

            procedencias.forEach(procedencia => {
                const optionDiv = document.createElement('div');
                optionDiv.className = 'multiselect-option';

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `proc_${procedencia}`;
                checkbox.value = procedencia;

                // Marcar Proativo e Reativo por padrão
                if (procedenciasPadrao.includes(procedencia.toUpperCase())) {
                    checkbox.checked = true;
                    optionDiv.classList.add('selected');
                }

                checkbox.addEventListener('change', () => {
                    optionDiv.classList.toggle('selected', checkbox.checked);
                    atualizarTextoProcedencia();
                });

                const label = document.createElement('label');
                label.htmlFor = `proc_${procedencia}`;
                label.textContent = procedencia;

                optionDiv.appendChild(checkbox);
                optionDiv.appendChild(label);
                dropdownProcedencia.appendChild(optionDiv);
            });

            // Atualizar texto inicial após criar todos os checkboxes
            atualizarTextoProcedencia();

            // Adicionar ações (Selecionar todos / Limpar)
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'multiselect-actions';
            actionsDiv.innerHTML = `
                <button class="btn btn-secondary" id="btnSelecionarTodos">Selecionar Todos</button>
                <button class="btn btn-secondary" id="btnLimparSelecao">Limpar</button>
            `;
            dropdownProcedencia.appendChild(actionsDiv);

            // Aguardar próximo tick para garantir que os elementos existem
            setTimeout(() => {
                const btnSelecionarTodos = document.getElementById('btnSelecionarTodos');
                const btnLimparSelecao = document.getElementById('btnLimparSelecao');

                if (btnSelecionarTodos) {
                    btnSelecionarTodos.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const checkboxes = dropdownProcedencia.querySelectorAll('input[type="checkbox"]');
                        checkboxes.forEach(cb => {
                            cb.checked = true;
                            cb.closest('.multiselect-option')?.classList.add('selected');
                        });
                        atualizarTextoProcedencia();
                    });
                }

                if (btnLimparSelecao) {
                    btnLimparSelecao.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const checkboxes = dropdownProcedencia.querySelectorAll('input[type="checkbox"]');
                        checkboxes.forEach(cb => {
                            cb.checked = false;
                            cb.closest('.multiselect-option')?.classList.remove('selected');
                        });
                        atualizarTextoProcedencia();
                    });
                }
            }, 0);
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
// Carregar Tempo de Backlog por Cluster
// ===========================================
async function carregarTempoBacklog() {
    try {
        const filtros = coletarFiltros();
        const filtrosValidos = {};
        for (const [chave, valor] of Object.entries(filtros)) {
            if (valor && valor.trim() !== '') {
                filtrosValidos[chave] = valor;
            }
        }

        const params = new URLSearchParams(filtrosValidos);
        const response = await fetch(`${API_BASE}/api/dashboard?${params}`);
        const resultado = await response.json();

        if (resultado.success) {
            const tbody = document.getElementById('tempoBacklogBody');
            const tfoot = document.getElementById('tempoBacklogFoot');
            
            const clusters = resultado.dados.clusters || [];
            const total = resultado.dados.total || {};
            
            if (clusters.length === 0) {
                tbody.innerHTML = '<tr><td colspan="16" style="text-align: center; padding: 40px; color: var(--text-muted);">Nenhum dado encontrado</td></tr>';
                tfoot.innerHTML = '';
                return;
            }

            // Preencher tbody
            let htmlBody = '';
            clusters.forEach(cluster => {
                htmlBody += `
                    <tr>
                        <td><strong>${cluster.cluster}</strong></td>
                        <td>${cluster.total_registros || 0}</td>
                        <td><span class="status-badge status-ativo">${cluster.ativos || 0}</span></td>
                        <td><span class="status-badge status-parado">${cluster.parados || 0}</span></td>
                        <td><span class="time-badge time-0-1h">${cluster.menos_1_hora || 0}</span></td>
                        <td><span class="time-badge time-1-3h">${cluster.entre_1_3_horas || 0}</span></td>
                        <td><span class="time-badge time-3-6h">${cluster.entre_3_6_horas || 0}</span></td>
                        <td><span class="time-badge time-6-8h">${cluster.entre_6_8_horas || 0}</span></td>
                        <td><span class="time-badge time-8-24h">${cluster.entre_8_24_horas || 0}</span></td>
                        <td><span class="time-badge time-1-3d">${cluster.entre_1_3_dias || 0}</span></td>
                        <td><span class="time-badge time-3-5d">${cluster.entre_3_5_dias || 0}</span></td>
                        <td><span class="time-badge time-5-7d">${cluster.entre_5_7_dias || 0}</span></td>
                        <td><span class="time-badge time-7-15d">${cluster.entre_7_15_dias || 0}</span></td>
                        <td><span class="time-badge time-15-30d">${cluster.entre_15_30_dias || 0}</span></td>
                        <td><span class="time-badge time-30d-plus">${cluster.mais_30_dias || 0}</span></td>
                        <td>${cluster.tempo_medio_horas ? parseFloat(cluster.tempo_medio_horas).toFixed(1) + 'h' : '-'}</td>
                    </tr>
                `;
            });
            tbody.innerHTML = htmlBody;

            // Preencher tfoot (total)
            const totalAtivos = clusters.reduce((sum, c) => sum + (c.ativos || 0), 0);
            const totalParados = clusters.reduce((sum, c) => sum + (c.parados || 0), 0);
            const totalMenos1h = clusters.reduce((sum, c) => sum + (c.menos_1_hora || 0), 0);
            const total1_3h = clusters.reduce((sum, c) => sum + (c.entre_1_3_horas || 0), 0);
            const total3_6h = clusters.reduce((sum, c) => sum + (c.entre_3_6_horas || 0), 0);
            const total6_8h = clusters.reduce((sum, c) => sum + (c.entre_6_8_horas || 0), 0);
            const total8_24h = clusters.reduce((sum, c) => sum + (c.entre_8_24_horas || 0), 0);
            const total1_3d = clusters.reduce((sum, c) => sum + (c.entre_1_3_dias || 0), 0);
            const total3_5d = clusters.reduce((sum, c) => sum + (c.entre_3_5_dias || 0), 0);
            const total5_7d = clusters.reduce((sum, c) => sum + (c.entre_5_7_dias || 0), 0);
            const total7_15d = clusters.reduce((sum, c) => sum + (c.entre_7_15_dias || 0), 0);
            const total15_30d = clusters.reduce((sum, c) => sum + (c.entre_15_30_dias || 0), 0);
            const totalMais30d = clusters.reduce((sum, c) => sum + (c.mais_30_dias || 0), 0);

            let htmlFoot = `
                <tr class="dashboard-total">
                    <td><strong>TOTAL</strong></td>
                    <td><strong>${total.total_geral || 0}</strong></td>
                    <td><strong>${totalAtivos}</strong></td>
                    <td><strong>${totalParados}</strong></td>
                    <td><strong>${totalMenos1h}</strong></td>
                    <td><strong>${total1_3h}</strong></td>
                    <td><strong>${total3_6h}</strong></td>
                    <td><strong>${total6_8h}</strong></td>
                    <td><strong>${total8_24h}</strong></td>
                    <td><strong>${total1_3d}</strong></td>
                    <td><strong>${total3_5d}</strong></td>
                    <td><strong>${total5_7d}</strong></td>
                    <td><strong>${total7_15d}</strong></td>
                    <td><strong>${total15_30d}</strong></td>
                    <td><strong>${totalMais30d}</strong></td>
                    <td>${total.media_geral_horas ? parseFloat(total.media_geral_horas).toFixed(1) + 'h' : '-'}</td>
                </tr>
            `;
            tfoot.innerHTML = htmlFoot;
        }
    } catch (error) {
        console.error('Erro ao carregar tempo de backlog:', error);
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
