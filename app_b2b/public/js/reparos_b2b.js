document.addEventListener('DOMContentLoaded', function() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const browseFiles = document.getElementById('browseFiles');
    const uploadProgress = document.getElementById('uploadProgress');
    const progressBar = uploadProgress.querySelector('.progress-bar');
    const statusMessage = document.getElementById('statusMessage');

    // Referências aos elementos de filtro
    const filtroRegional = document.getElementById('filtroRegional');
    const filtroKPI = document.getElementById('filtroKPI');
    const filtroMes = document.getElementById('filtroMes');
    const botaoFiltrar = document.getElementById('aplicarFiltro');

    // Evento para abrir o diálogo de seleção de arquivo
    browseFiles.addEventListener('click', function() {
        fileInput.click();
    });

    // Evento quando um arquivo é selecionado
    fileInput.addEventListener('change', function() {
        if (this.files.length) {
            handleFile(this.files[0]);
        }
    });

    // Eventos para arrastar e soltar arquivos
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    function highlight() {
        dropZone.classList.add('dragover');
    }

    function unhighlight() {
        dropZone.classList.remove('dragover');
    }

    // Evento para quando o arquivo é solto
    dropZone.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const file = dt.files[0];
        handleFile(file);
    }

    function handleFile(file) {
        // Verifica se o arquivo é um Excel
        if (!file.name.match(/\.(xlsx|xls)$/i)) {
            showMessage('Por favor, selecione um arquivo Excel (.xlsx ou .xls)', 'error');
            return;
        }

        // Realiza o upload do arquivo
        realUpload(file);
    }

    function realUpload(file) {
        // Prepara o formulário para envio
        const formData = new FormData();
        formData.append('file', file);

        // Atualiza mensagem de status
        statusMessage.textContent = `Enviando: ${file.name}`;
        statusMessage.className = 'status-message info';

        // Mostra a barra de progresso
        uploadProgress.style.display = 'block';
        progressBar.style.width = '0%';

        // Faz o upload via AJAX
        $.ajax({
            url: '/b2b/upload-reparos',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            xhr: function() {
                const xhr = new window.XMLHttpRequest();

                // Upload progress
                xhr.upload.addEventListener("progress", function(evt) {
                    if (evt.lengthComputable) {
                        const percentComplete = evt.loaded / evt.total * 100;
                        progressBar.style.width = percentComplete + '%';
                    }
                }, false);
                return xhr;
            },
            success: function(response) {
                uploadProgress.style.display = 'none';
                if (response.success) {
                    showMessage(response.message || 'Dados enviados e processados com sucesso!', 'success');
                } else {
                    showMessage(response.message || 'Erro ao processar o arquivo.', 'error');
                }
            },
            error: function(xhr, status, error) {
                uploadProgress.style.display = 'none';
                let errorMessage = 'Erro ao enviar o arquivo.';
                if (xhr.responseJSON && xhr.responseJSON.error) {
                    errorMessage = xhr.responseJSON.error;
                } else if (error) {
                    errorMessage = error;
                }
                showMessage(errorMessage, 'error');
            }
        });
    }

    function showMessage(message, type) {
        statusMessage.textContent = message;
        statusMessage.className = `status-message ${type}`;

        // Auto-hide success messages after 5 seconds
        if (type === 'success') {
            setTimeout(() => {
                if (statusMessage.textContent === message) {
                    statusMessage.style.display = 'none';
                }
            }, 5000);
        }
    }

    // Atualizar dados na aba de análise
    document.getElementById('atualizarDados').addEventListener('click', function() {
        loadAnalysisData();
    });

    // Função para carregar dados de análise com filtros
    function loadAnalysisData() {
        document.getElementById('loadingAnalise').style.display = 'block';

        // Obter valores dos filtros
        const regional = filtroRegional.value;
        const kpi = filtroKPI.value;
        const mesAno = filtroMes.value; // Valor no formato YYYY-MM

        // Parâmetros para a requisição
        const params = new URLSearchParams();
        if (regional) params.append('regional', regional);
        if (kpi) params.append('kpi', kpi);
        if (mesAno) params.append('mes_ano', mesAno);

        // Faz a requisição para obter dados de análise com filtros
        $.get(`/b2b/analise-data?${params.toString()}`)
            .done(function(data) {
                document.getElementById('loadingAnalise').style.display = 'none';

                // Atualiza a tabela com dados reais
                updateAnalysisTable(data);
            })
            .fail(function(error) {
                document.getElementById('loadingAnalise').style.display = 'none';
                let errorMessage = 'Erro ao carregar dados de análise.';
                if (error.responseJSON && error.responseJSON.error) {
                    errorMessage = error.responseJSON.error;
                } else if (error.statusText) {
                    errorMessage = error.statusText;
                }
                showMessage(errorMessage, 'error');
            });
    }

    // Função para atualizar a tabela de análise
    function updateAnalysisTable(data) {
        const container = document.getElementById('tabelasAnaliseContainer');
        container.innerHTML = '';
        
        // Determinar o mês e ano selecionados no filtro ou usar o mês atual
        let selectedDate = new Date();
        if (filtroMes.value) {
            const [year, month] = filtroMes.value.split('-');
            selectedDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        } else {
            // Define o mês atual como padrão no campo de filtro
            const currentYear = selectedDate.getFullYear();
            const currentMonth = String(selectedDate.getMonth() + 1).padStart(2, '0');
            filtroMes.value = `${currentYear}-${currentMonth}`;
        }
        
        const selectedYear = selectedDate.getFullYear();
        const selectedMonth = selectedDate.getMonth();
        const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
        
        // Verificar se data é um array e se está vazio
        if (!Array.isArray(data) || data.length === 0) {
            const div = document.createElement('div');
            div.className = 'alert alert-info';
            div.textContent = 'Nenhum dado encontrado';
            container.appendChild(div);
            return;
        }

        // Verificar se o filtro de regional está selecionado
        const regionalFiltrada = filtroRegional.value;
        
        if (regionalFiltrada) {
            // Caso 1: Regional está filtrada - mostrar uma tabela para cada cluster dentro da regional
            const clustersUnicos = [...new Set(data.filter(item => item.cluster).map(item => item.cluster))];
            
            clustersUnicos.forEach(cluster => {
                const dadosCluster = data.filter(item => item.cluster === cluster);
                
                const card = document.createElement('div');
                card.className = 'card mb-4';
                
                const header = document.createElement('div');
                header.className = 'card-header bg-light';
                header.innerHTML = `<h6 class="mb-0"><i class="fas fa-chart-line"></i> Cluster: ${cluster}</h6>`;
                
                const body = document.createElement('div');
                body.className = 'card-body';
                
                const tableDiv = document.createElement('div');
                tableDiv.className = 'table-responsive';
                
                const table = document.createElement('table');
                table.className = 'table table-bordered';
                table.id = `tabelaAnaliseCluster-${cluster.replace(/\s+/g, '_')}`; // ID único para cada tabela
                
                // Gerar cabeçalhos dos dias
                let headerRow = document.createElement('thead');
                headerRow.className = 'table-dark';
                let headerContent = '<tr><th>Tipo</th>';
                for (let day = 1; day <= daysInMonth; day++) {
                    headerContent += `<th>${day}</th>`;
                }
                headerContent += '<th>Total</th>'; // Adicionando coluna de total
                headerContent += '</tr>';
                headerRow.innerHTML = headerContent;
                
                let tbody = document.createElement('tbody');
                
                // Linha 1: Entrantes por dia (contagem por data_abertura)
                const entrantesRow = document.createElement('tr');
                entrantesRow.innerHTML = '<td><strong>Entrantes</strong></td>';
                
                // Contar entrantes por dia
                const entrantesPorDia = {};
                for (let day = 1; day <= daysInMonth; day++) {
                    entrantesPorDia[day] = 0;
                }
                
                // Processar os dados para contar entrantes por dia
                dadosCluster.forEach(row => {
                    if (row.data_abertura) {
                        const dataAbertura = new Date(row.data_abertura);
                        if (dataAbertura.getFullYear() === selectedYear && dataAbertura.getMonth() === selectedMonth) {
                            const dia = dataAbertura.getDate();
                            if (entrantesPorDia.hasOwnProperty(dia)) {
                                entrantesPorDia[dia]++;
                            }
                        }
                    }
                });
                
                // Adicionar os valores de entrantes por dia
                let totalEntrantes = 0;
                for (let day = 1; day <= daysInMonth; day++) {
                    totalEntrantes += (entrantesPorDia[day] || 0);
                    entrantesRow.innerHTML += `<td>${entrantesPorDia[day]}</td>`;
                }
                entrantesRow.innerHTML += `<td><strong>${totalEntrantes}</strong></td>`; // Coluna total
                
                // Linha 2: Encerrados por dia (contagem por data_encerramento)
                const encerradosRow = document.createElement('tr');
                encerradosRow.innerHTML = '<td><strong>Encerrados</strong></td>';
                
                // Contar encerrados por dia
                const encerradosPorDia = {};
                for (let day = 1; day <= daysInMonth; day++) {
                    encerradosPorDia[day] = 0;
                }
                
                // Processar os dados para contar encerrados por dia
                dadosCluster.forEach(row => {
                    if (row.data_encerramento) {
                        const dataEncerramento = new Date(row.data_encerramento);
                        if (dataEncerramento.getFullYear() === selectedYear && dataEncerramento.getMonth() === selectedMonth) {
                            const dia = dataEncerramento.getDate();
                            if (encerradosPorDia.hasOwnProperty(dia)) {
                                encerradosPorDia[dia]++;
                            }
                        }
                    }
                });
                
                // Adicionar os valores de encerrados por dia
                let totalEncerrados = 0;
                for (let day = 1; day <= daysInMonth; day++) {
                    totalEncerrados += (encerradosPorDia[day] || 0);
                    encerradosRow.innerHTML += `<td>${encerradosPorDia[day]}</td>`;
                }
                encerradosRow.innerHTML += `<td><strong>${totalEncerrados}</strong></td>`; // Coluna total
                
                // Linha 3: Eficiência por dia (encerrados / entrantes * 100)
                const eficienciaRow = document.createElement('tr');
                eficienciaRow.innerHTML = '<td><strong>Eficiência (%)</strong></td>';
                
                // Calcular eficiência por dia
                for (let day = 1; day <= daysInMonth; day++) {
                    const entrantes = entrantesPorDia[day] || 0;
                    const encerrados = encerradosPorDia[day] || 0;
                    let eficiencia = 0;
                    
                    if (entrantes > 0) {
                        eficiencia = ((encerrados / entrantes) * 100).toFixed(1);
                    }
                    
                    eficienciaRow.innerHTML += `<td>${eficiencia}%</td>`;
                }
                
                // Calcular eficiência total
                let eficienciaTotal = 0;
                if (totalEntrantes > 0) {
                    eficienciaTotal = ((totalEncerrados / totalEntrantes) * 100).toFixed(1);
                }
                
                eficienciaRow.innerHTML += `<td><strong>${eficienciaTotal}%</strong></td>`; // Coluna total
                
                tbody.appendChild(entrantesRow);
                tbody.appendChild(encerradosRow);
                tbody.appendChild(eficienciaRow);
                
                table.appendChild(headerRow);
                table.appendChild(tbody);
                tableDiv.appendChild(table);
                body.appendChild(tableDiv);
                card.appendChild(header);
                card.appendChild(body);
                
                container.appendChild(card);
            });
        } else {
            // Caso 2: Regional não está filtrada - mostrar uma tabela para cada regional
            const regionaisUnicas = [...new Set(data.filter(item => item.regional_vivo).map(item => item.regional_vivo))];
            
            regionaisUnicas.forEach(regional => {
                const dadosRegional = data.filter(item => item.regional_vivo === regional);
                
                const card = document.createElement('div');
                card.className = 'card mb-4';
                
                const header = document.createElement('div');
                header.className = 'card-header bg-light';
                header.innerHTML = `<h6 class="mb-0"><i class="fas fa-chart-line"></i> Regional: ${regional}</h6>`;
                
                const body = document.createElement('div');
                body.className = 'card-body';
                
                const tableDiv = document.createElement('div');
                tableDiv.className = 'table-responsive';
                
                const table = document.createElement('table');
                table.className = 'table table-bordered';
                table.id = `tabelaAnaliseRegional-${regional.replace(/\s+/g, '_')}`; // ID único para cada tabela
                
                // Gerar cabeçalhos dos dias
                let headerRow = document.createElement('thead');
                headerRow.className = 'table-dark';
                let headerContent = '<tr><th>Tipo</th>';
                for (let day = 1; day <= daysInMonth; day++) {
                    headerContent += `<th>${day}</th>`;
                }
                headerContent += '<th>Total</th>'; // Adicionando coluna de total
                headerContent += '</tr>';
                headerRow.innerHTML = headerContent;
                
                let tbody = document.createElement('tbody');
                
                // Linha 1: Entrantes por dia (contagem por data_abertura)
                const entrantesRow = document.createElement('tr');
                entrantesRow.innerHTML = '<td><strong>Entrantes</strong></td>';
                
                // Contar entrantes por dia
                const entrantesPorDia = {};
                for (let day = 1; day <= daysInMonth; day++) {
                    entrantesPorDia[day] = 0;
                }
                
                // Processar os dados para contar entrantes por dia
                dadosRegional.forEach(row => {
                    if (row.data_abertura) {
                        const dataAbertura = new Date(row.data_abertura);
                        if (dataAbertura.getFullYear() === selectedYear && dataAbertura.getMonth() === selectedMonth) {
                            const dia = dataAbertura.getDate();
                            if (entrantesPorDia.hasOwnProperty(dia)) {
                                entrantesPorDia[dia]++;
                            }
                        }
                    }
                });
                
                // Adicionar os valores de entrantes por dia
                let totalEntrantes = 0;
                for (let day = 1; day <= daysInMonth; day++) {
                    totalEntrantes += (entrantesPorDia[day] || 0);
                    entrantesRow.innerHTML += `<td>${entrantesPorDia[day]}</td>`;
                }
                entrantesRow.innerHTML += `<td><strong>${totalEntrantes}</strong></td>`; // Coluna total
                
                // Linha 2: Encerrados por dia (contagem por data_encerramento)
                const encerradosRow = document.createElement('tr');
                encerradosRow.innerHTML = '<td><strong>Encerrados</strong></td>';
                
                // Contar encerrados por dia
                const encerradosPorDia = {};
                for (let day = 1; day <= daysInMonth; day++) {
                    encerradosPorDia[day] = 0;
                }
                
                // Processar os dados para contar encerrados por dia
                dadosRegional.forEach(row => {
                    if (row.data_encerramento) {
                        const dataEncerramento = new Date(row.data_encerramento);
                        if (dataEncerramento.getFullYear() === selectedYear && dataEncerramento.getMonth() === selectedMonth) {
                            const dia = dataEncerramento.getDate();
                            if (encerradosPorDia.hasOwnProperty(dia)) {
                                encerradosPorDia[dia]++;
                            }
                        }
                    }
                });
                
                // Adicionar os valores de encerrados por dia
                let totalEncerrados = 0;
                for (let day = 1; day <= daysInMonth; day++) {
                    totalEncerrados += (encerradosPorDia[day] || 0);
                    encerradosRow.innerHTML += `<td>${encerradosPorDia[day]}</td>`;
                }
                encerradosRow.innerHTML += `<td><strong>${totalEncerrados}</strong></td>`; // Coluna total
                
                // Linha 3: Eficiência por dia (encerrados / entrantes * 100)
                const eficienciaRow = document.createElement('tr');
                eficienciaRow.innerHTML = '<td><strong>Eficiência (%)</strong></td>';
                
                // Calcular eficiência por dia
                for (let day = 1; day <= daysInMonth; day++) {
                    const entrantes = entrantesPorDia[day] || 0;
                    const encerrados = encerradosPorDia[day] || 0;
                    let eficiencia = 0;
                    
                    if (entrantes > 0) {
                        eficiencia = ((encerrados / entrantes) * 100).toFixed(1);
                    }
                    
                    eficienciaRow.innerHTML += `<td>${eficiencia}%</td>`;
                }
                
                // Calcular eficiência total
                let eficienciaTotal = 0;
                if (totalEntrantes > 0) {
                    eficienciaTotal = ((totalEncerrados / totalEntrantes) * 100).toFixed(1);
                }
                
                eficienciaRow.innerHTML += `<td><strong>${eficienciaTotal}%</strong></td>`; // Coluna total
                
                tbody.appendChild(entrantesRow);
                tbody.appendChild(encerradosRow);
                tbody.appendChild(eficienciaRow);
                
                table.appendChild(headerRow);
                table.appendChild(tbody);
                tableDiv.appendChild(table);
                body.appendChild(tableDiv);
                card.appendChild(header);
                card.appendChild(body);
                
                container.appendChild(card);
            });
        }
    }

    // Função para atualizar o gráfico de análise
    function updateAnalysisChart(data) {
        // Esta função está vazia pois o gráfico foi removido
        // Mantendo a função para evitar erros no código existente
    }

    // Carrega dados iniciais ao mostrar a aba de análise
    document.querySelector('#analise-tab').addEventListener('shown.bs.tab', function() {
        loadAnalysisData();
    });

    // Adiciona funcionalidade de clique para o botão de atualizar dados na aba de upload
    document.querySelector('#upload-tab').addEventListener('shown.bs.tab', function() {
        // Limpa mensagens de status ao voltar para a aba de upload
        statusMessage.style.display = 'block';
    });
    
    // Carrega os dados automaticamente quando a página é carregada
    // Somente se a aba de análise estiver visível (ativa)
    if (document.querySelector('#analise').classList.contains('active')) {
        loadAnalysisData();
    }
    
    // Eventos para os filtros - removendo o carregamento automático ao mudar os filtros
    // filtroRegional.addEventListener('change', loadAnalysisData);
    // filtroKPI.addEventListener('change', loadAnalysisData);
    
    // Adicionando evento para o botão Filtrar
    botaoFiltrar.addEventListener('click', loadAnalysisData);
    
    // Adicionando evento para o botão Limpar Filtros
    document.getElementById('limparFiltros').addEventListener('click', function() {
        // Limpar todos os filtros
        filtroRegional.value = '';
        filtroKPI.value = '';
        
        // Definir o mês atual como padrão
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
        filtroMes.value = `${currentYear}-${currentMonth}`;
        
        // Carregar os dados com os filtros limpos
        loadAnalysisData();
    });
    
    // Função para carregar opções de filtros
    function loadFilterOptions() {
        // Carregar opções de regional
        $.get('/b2b/filtros-opcoes?campo=regional_vivo')
            .done(function(data) {
                // Limpar opções atuais
                filtroRegional.innerHTML = '<option value="">Todas as Regionais</option>';
                
                // Verificar se há dados antes de adicionar opções
                if (Array.isArray(data) && data.length > 0) {
                    // Adicionar novas opções
                    data.forEach(function(valor) {
                        if (valor) { // Verificar se o valor não é nulo ou vazio
                            const option = document.createElement('option');
                            option.value = valor;
                            option.textContent = valor;
                            filtroRegional.appendChild(option);
                        }
                    });
                }
            })
            .fail(function(error) {
                console.error('Erro ao carregar opções de regional:', error);
            });
            
        // Carregar opções de KPI
        $.get('/b2b/filtros-opcoes?campo=kpi')
            .done(function(data) {
                // Limpar opções atuais
                filtroKPI.innerHTML = '<option value="">Todos os KPIs</option>';
                
                // Verificar se há dados antes de adicionar opções
                if (Array.isArray(data) && data.length > 0) {
                    // Adicionar novas opções
                    data.forEach(function(valor) {
                        if (valor) { // Verificar se o valor não é nulo ou vazio
                            const option = document.createElement('option');
                            option.value = valor;
                            option.textContent = valor;
                            filtroKPI.appendChild(option);
                        }
                    });
                }
            })
            .fail(function(error) {
                console.error('Erro ao carregar opções de KPI:', error);
            });
    }
    
    // Carregar opções de filtros quando a aba de análise for mostrada
    document.querySelector('#analise-tab').addEventListener('shown.bs.tab', function() {
        loadFilterOptions();
    });
    
    // Carregar opções de filtros quando a página é carregada
    loadFilterOptions();
    
    // Função para obter a data da última atualização da base
    function obterUltimaAtualizacao() {
        // Fazer uma requisição para obter a data da última atualização
        $.get('/b2b/ultima-atualizacao')
            .done(function(data) {
                if (data && data.ultima_atualizacao) {
                    // Formatar a data para exibição no tooltip
                    const dataFormatada = new Date(data.ultima_atualizacao).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                    });
                    
                    // Verificar se a data de atualização é de hoje
                    const dataAtualizacao = new Date(data.ultima_atualizacao);
                    const hoje = new Date();
                    hoje.setHours(0, 0, 0, 0); // Zerar horas para comparação apenas de data
                    dataAtualizacao.setHours(0, 0, 0, 0);
                    
                    // Atualizar o tooltip com a data real
                    const d1Indicator = document.getElementById('d1Indicator');
                    d1Indicator.setAttribute('data-bs-original-title', `Última atualização: ${dataFormatada}`);
                    
                    // Definir cor do badge com base na data
                    if (dataAtualizacao.getTime() === hoje.getTime()) {
                        // Data de hoje - verde
                        d1Indicator.className = 'badge bg-success';
                    } else {
                        // Data anterior - vermelho
                        d1Indicator.className = 'badge bg-danger';
                    }
                    
                    // Re-inicializar o tooltip para refletir a mudança
                    var tooltip = bootstrap.Tooltip.getInstance(d1Indicator);
                    if (tooltip) {
                        tooltip.dispose();
                    }
                    new bootstrap.Tooltip(d1Indicator);
                }
            })
            .fail(function(error) {
                console.error('Erro ao obter a última atualização:', error);
            });
    }
    
    // Carregar a data da última atualização quando a página é carregada
    obterUltimaAtualizacao();
    
    // Atualizar a data da última atualização após atualizar os dados
    document.getElementById('atualizarDados').addEventListener('click', function() {
        setTimeout(() => {
            obterUltimaAtualizacao();
        }, 2000); // Pequeno delay para garantir que a atualização foi concluída
    });
});