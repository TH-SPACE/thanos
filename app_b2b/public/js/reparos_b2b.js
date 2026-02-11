document.addEventListener('DOMContentLoaded', function() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const browseFiles = document.getElementById('browseFiles');
    const uploadProgress = document.getElementById('uploadProgress');
    const progressBar = uploadProgress.querySelector('.progress-bar');
    const statusMessage = document.getElementById('statusMessage');

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

    // Função para carregar dados de análise
    function loadAnalysisData() {
        document.getElementById('loadingAnalise').style.display = 'block';

        // Faz a requisição para obter dados de análise
        $.get('/b2b/analise-data')
            .done(function(data) {
                document.getElementById('loadingAnalise').style.display = 'none';

                // Atualiza a tabela com dados reais
                updateAnalysisTable(data);

                // Atualiza o gráfico
                updateAnalysisChart(data);
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
        tbody.innerHTML = '';

        if (data.length === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td colspan="4" class="text-center">Nenhum dado encontrado</td>`;
            tbody.appendChild(tr);
            return;
        }

        data.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row.cluster || 'Não especificado'}</td>
                <td>${row.entrantes || 0}</td>
                <td>${row.encerramentos || 0}</td>
                <td>${row.diferenca || 0}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Função para atualizar o gráfico de análise
    function updateAnalysisChart(data) {
        const ctx = document.getElementById('graficoAnaliseCluster').getContext('2d');

        // Destruir instância anterior do gráfico se existir
        if (window.analysisChart) {
            window.analysisChart.destroy();
        }

        if (data.length === 0) {
            // Mostrar mensagem de "sem dados" no lugar do gráfico
            ctx.canvas.parentElement.innerHTML = '<div class="d-flex align-items-center justify-content-center h-100"><p class="text-muted">Nenhum dado disponível para exibir no gráfico</p></div>';
            return;
        }

        const clusters = data.map(item => item.cluster || 'Não especificado');
        const entrantes = data.map(item => item.entrantes || 0);
        const encerramentos = data.map(item => item.encerramentos || 0);

        window.analysisChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: clusters,
                datasets: [
                    {
                        label: 'Entrantes (Data Abertura)',
                        data: entrantes,
                        backgroundColor: 'rgba(54, 162, 235, 0.5)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Encerramentos (Data Encerramento)',
                        data: encerramentos,
                        backgroundColor: 'rgba(255, 99, 132, 0.5)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false, // Permite dimensionamento flexível
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0 // Exibe números inteiros
                        }
                    },
                    x: {
                        ticks: {
                            maxRotation: 45, // Rotaciona os rótulos se necessário
                            minRotation: 0
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Comparativo de Entrantes vs Encerramentos por Cluster'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
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
});