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

        // Parâmetros para a requisição
        const params = new URLSearchParams();
        if (regional) params.append('regional', regional);
        if (kpi) params.append('kpi', kpi);

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
        const tbody = document.querySelector('#tabelaAnaliseCluster tbody');
        const thead = document.querySelector('#tabelaAnaliseCluster thead');
        tbody.innerHTML = '';
        
        // Determinar o número de dias no mês atual
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        
        // Gerar cabeçalhos dos dias
        let headerRow = '<tr><th>Tipo</th>';
        for (let day = 1; day <= daysInMonth; day++) {
            headerRow += `<th>${day}</th>`;
        }
        headerRow += '</tr>';
        thead.innerHTML = headerRow;

        // Verificar se data é um array e se está vazio
        if (!Array.isArray(data) || data.length === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td colspan="${daysInMonth + 1}" class="text-center">Nenhum dado encontrado</td>`;
            tbody.appendChild(tr);
            return;
        }

        // Criar as duas linhas solicitadas (Entrantes e Encerrados)
        
        // Linha 1: Entrantes por dia (contagem por data_abertura)
        const entrantesRow = document.createElement('tr');
        entrantesRow.innerHTML = '<td><strong>Entrantes</strong></td>';
        
        // Contar entrantes por dia
        const entrantesPorDia = {};
        for (let day = 1; day <= daysInMonth; day++) {
            entrantesPorDia[day] = 0;
        }
        
        // Processar os dados para contar entrantes por dia
        data.forEach(row => {
            if (row.data_abertura) {
                const dataAbertura = new Date(row.data_abertura);
                if (dataAbertura.getFullYear() === currentYear && dataAbertura.getMonth() === currentMonth) {
                    const dia = dataAbertura.getDate();
                    if (entrantesPorDia.hasOwnProperty(dia)) {
                        entrantesPorDia[dia]++;
                    }
                }
            }
        });
        
        // Adicionar os valores de entrantes por dia
        for (let day = 1; day <= daysInMonth; day++) {
            entrantesRow.innerHTML += `<td>${entrantesPorDia[day]}</td>`;
        }
        tbody.appendChild(entrantesRow);
        
        // Linha 2: Encerrados por dia (contagem por data_encerramento)
        const encerradosRow = document.createElement('tr');
        encerradosRow.innerHTML = '<td><strong>Encerrados</strong></td>';
        
        // Contar encerrados por dia
        const encerradosPorDia = {};
        for (let day = 1; day <= daysInMonth; day++) {
            encerradosPorDia[day] = 0;
        }
        
        // Processar os dados para contar encerrados por dia
        data.forEach(row => {
            if (row.data_encerramento) {
                const dataEncerramento = new Date(row.data_encerramento);
                if (dataEncerramento.getFullYear() === currentYear && dataEncerramento.getMonth() === currentMonth) {
                    const dia = dataEncerramento.getDate();
                    if (encerradosPorDia.hasOwnProperty(dia)) {
                        encerradosPorDia[dia]++;
                    }
                }
            }
        });
        
        // Adicionar os valores de encerrados por dia
        for (let day = 1; day <= daysInMonth; day++) {
            encerradosRow.innerHTML += `<td>${encerradosPorDia[day]}</td>`;
        }
        tbody.appendChild(encerradosRow);
        
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
        tbody.appendChild(eficienciaRow);
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
});