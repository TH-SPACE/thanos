document.addEventListener('DOMContentLoaded', function() {
    // Elementos do modal de upload (verificar se existem antes de acessar)
    const dropZoneModal = document.getElementById('dropZoneModal');
    const fileInputModal = document.getElementById('fileInputModal');
    const browseFilesModal = document.getElementById('browseFilesModal');
    const uploadProgressModal = document.getElementById('uploadProgressModal');
    const progressBarModal = uploadProgressModal ? uploadProgressModal.querySelector('.progress-bar') : null;
    const statusMessageModal = document.getElementById('statusMessageModal');
    const uploadWarning = document.getElementById('uploadWarning');
    const selectedFileInfo = document.getElementById('selectedFileInfo');
    const fileNameSpan = document.getElementById('fileName');
    const enviarBtn = document.getElementById('enviarBtn');
    
    // Variável para armazenar o arquivo selecionado
    let arquivoSelecionado = null;
    
    // Referências aos elementos de filtro
    const filtroRegional = document.getElementById('filtroRegional');
    const filtroKPI = document.getElementById('filtroKPI');
    const filtroMes = document.getElementById('filtroMes');
    const botaoFiltrar = document.getElementById('aplicarFiltro');

    // Elementos da antiga aba de upload não existem mais, então não precisamos deles
    // Apenas os elementos do modal de upload são relevantes agora
    
    // Eventos para o modal de upload (somente se os elementos existirem)
    if (browseFilesModal && fileInputModal) {
        // Evento para abrir o diálogo de seleção de arquivo (modal)
        browseFilesModal.addEventListener('click', function() {
            fileInputModal.click();
        });

        // Evento quando um arquivo é selecionado (modal)
        fileInputModal.addEventListener('change', function() {
            if (this.files.length) {
                arquivoSelecionado = this.files[0];
                
                // Mostrar informações do arquivo selecionado
                if (selectedFileInfo && fileNameSpan) {
                    fileNameSpan.textContent = arquivoSelecionado.name;
                    selectedFileInfo.style.display = 'block';
                }
                
                // Habilitar o botão de enviar
                if (enviarBtn) {
                    enviarBtn.disabled = false;
                }
            } else {
                // Desabilitar o botão de enviar se não houver arquivo
                if (enviarBtn) {
                    enviarBtn.disabled = true;
                }
                
                // Ocultar informações do arquivo selecionado
                if (selectedFileInfo) {
                    selectedFileInfo.style.display = 'none';
                }
            }
        });
        
        // Adicionando um listener para monitorar mudanças no valor do input
        fileInputModal.addEventListener('input', function() {
            if (!this.value) {
                // Desabilitar o botão de enviar se o input estiver vazio
                if (enviarBtn) {
                    enviarBtn.disabled = true;
                }
                
                // Ocultar informações do arquivo selecionado
                if (selectedFileInfo) {
                    selectedFileInfo.style.display = 'none';
                }
                
                arquivoSelecionado = null;
            }
        });
        
        // Evento para o botão de envio
        if (enviarBtn) {
            enviarBtn.addEventListener('click', function() {
                if (arquivoSelecionado) {
                    handleFileModal(arquivoSelecionado);
                } else {
                    showMessageModal('Por favor, selecione um arquivo primeiro.', 'error');
                }
            });
        }
        
        // Listener para quando o modal é aberto para garantir que o estado inicial esteja correto
        const uploadModalElement = document.getElementById('uploadModal');
        if (uploadModalElement) {
            uploadModalElement.addEventListener('shown.bs.modal', function () {
                // Certificar-se de que o botão de enviar está desabilitado inicialmente
                if (enviarBtn) {
                    enviarBtn.disabled = true;
                }
                
                // Certificar-se de que o input de arquivo está limpo
                if (fileInputModal) {
                    fileInputModal.value = '';
                    // Disparar o evento change para garantir que o estado seja atualizado
                    fileInputModal.dispatchEvent(new Event('change'));
                }
            });
            
            // Listener para quando o modal é fechado para limpar o estado
            uploadModalElement.addEventListener('hidden.bs.modal', function () {
                // Limpar o input de arquivo e ocultar informações do arquivo selecionado
                if (fileInputModal) {
                    fileInputModal.value = '';
                    // Disparar o evento change para garantir que o estado seja atualizado
                    fileInputModal.dispatchEvent(new Event('change'));
                }
                if (selectedFileInfo) {
                    selectedFileInfo.style.display = 'none';
                }
                arquivoSelecionado = null;
                
                // Resetar o botão de enviar
                if (enviarBtn) {
                    enviarBtn.disabled = false;
                }
            });
        }
    }

    
    // Eventos para arrastar e soltar arquivos (modal) - somente se o elemento existir
    if (dropZoneModal) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZoneModal.addEventListener(eventName, preventDefaultsModal, false);
        });

        function preventDefaultsModal(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZoneModal.addEventListener(eventName, highlightModal, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZoneModal.addEventListener(eventName, unhighlightModal, false);
        });

        function highlightModal() {
            dropZoneModal.classList.add('dragover');
        }

        function unhighlightModal() {
            dropZoneModal.classList.remove('dragover');
        }

        // Evento para quando o arquivo é solto (modal)
        dropZoneModal.addEventListener('drop', handleDropModal, false);

        function handleDropModal(e) {
            const dt = e.dataTransfer;
            const file = dt.files[0];
            arquivoSelecionado = file;
            
            // Mostrar informações do arquivo selecionado
            if (selectedFileInfo && fileNameSpan) {
                fileNameSpan.textContent = arquivoSelecionado.name;
                selectedFileInfo.style.display = 'block';
            }
            
            // Habilitar o botão de enviar
            if (enviarBtn) {
                enviarBtn.disabled = false;
            }
        }
    }

    
    // Funções para o modal de upload
    function handleFileModal(file) {
        // Verifica se o arquivo é um Excel
        if (!file.name.match(/\.(xlsx|xls)$/i)) {
            showMessageModal('Por favor, selecione um arquivo Excel (.xlsx ou .xls)', 'error');
            
            // Limpar o input de arquivo e ocultar informações do arquivo selecionado
            if (fileInputModal) {
                fileInputModal.value = '';
            }
            if (selectedFileInfo) {
                selectedFileInfo.style.display = 'none';
            }
            arquivoSelecionado = null;
            
            // Desabilitar o botão de enviar
            if (enviarBtn) {
                enviarBtn.disabled = true;
            }
            return;
        }

        // Desabilitar o botão de enviar durante o upload
        if (enviarBtn) {
            enviarBtn.disabled = true;
        }

        // Realiza o upload do arquivo
        realUploadModal(file);
    }

    function realUploadModal(file) {
        // Prepara o formulário para envio
        const formData = new FormData();
        formData.append('file', file);

        // Atualiza mensagem de status
        if (statusMessageModal) {
            statusMessageModal.textContent = `Enviando: ${file.name}`;
            statusMessageModal.className = 'status-message info';
        }

        // Mostra a barra de progresso
        if (uploadProgressModal && progressBarModal) {
            uploadProgressModal.style.display = 'block';
            progressBarModal.style.width = '0%';
            progressBarModal.textContent = '0%';
        }
        
        // Mostra o aviso para não fechar a janela
        if (uploadWarning) {
            uploadWarning.style.display = 'block';
        }

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
                    if (evt.lengthComputable && progressBarModal) {
                        const percentComplete = evt.loaded / evt.total * 100;
                        progressBarModal.style.width = percentComplete + '%';
                        progressBarModal.textContent = Math.round(percentComplete) + '%';
                    }
                }, false);
                return xhr;
            },
            success: function(response) {
                if (uploadProgressModal) {
                    uploadProgressModal.style.display = 'none';
                }
                if (uploadWarning) {
                    uploadWarning.style.display = 'none';
                }
                if (response.success) {
                    showMessageModal(response.message || 'Dados enviados e processados com sucesso!', 'success');
                    // Limpar o input de arquivo e ocultar informações do arquivo selecionado
                    if (fileInputModal) {
                        fileInputModal.value = '';
                        // Disparar o evento change para garantir que o estado seja atualizado
                        fileInputModal.dispatchEvent(new Event('change'));
                    }
                    if (selectedFileInfo) {
                        selectedFileInfo.style.display = 'none';
                    }
                    arquivoSelecionado = null;
                    
                    // Fechar o modal após 2 segundos se for bem sucedido
                    setTimeout(() => {
                        const uploadModal = bootstrap.Modal.getInstance(document.getElementById('uploadModal'));
                        if (uploadModal) {
                            uploadModal.hide();
                        }
                    }, 2000);
                } else {
                    showMessageModal(response.message || 'Erro ao processar o arquivo.', 'error');
                }
            },
            error: function(xhr, status, error) {
                if (uploadProgressModal) {
                    uploadProgressModal.style.display = 'none';
                }
                if (uploadWarning) {
                    uploadWarning.style.display = 'none';
                }
                let errorMessage = 'Erro ao enviar o arquivo.';
                if (xhr.responseJSON && xhr.responseJSON.error) {
                    errorMessage = xhr.responseJSON.error;
                } else if (error) {
                    errorMessage = error;
                }
                showMessageModal(errorMessage, 'error');
                
                // Limpar o input de arquivo e ocultar informações do arquivo selecionado
                if (fileInputModal) {
                    fileInputModal.value = '';
                    // Disparar o evento change para garantir que o estado seja atualizado
                    fileInputModal.dispatchEvent(new Event('change'));
                }
                if (selectedFileInfo) {
                    selectedFileInfo.style.display = 'none';
                }
                arquivoSelecionado = null;
            }
        });
    }

    function showMessageModal(message, type) {
        if (statusMessageModal) {
            statusMessageModal.textContent = message;
            statusMessageModal.className = `status-message ${type}`;

            // Auto-hide success messages after 5 seconds
            if (type === 'success') {
                setTimeout(() => {
                    if (statusMessageModal && statusMessageModal.textContent === message) {
                        statusMessageModal.style.display = 'none';
                    }
                }, 5000);
            }
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
        const mesAno = filtroMes.value; // Valor no formato YYYY-MM
        
        // Obter os KPIs selecionados
        const selectedKPIs = Array.from(document.querySelectorAll('.kpi-checkbox:checked')).map(cb => cb.value);
        const kpiParam = selectedKPIs.length > 0 ? selectedKPIs.join(',') : '';

        // Parâmetros para a requisição
        const params = new URLSearchParams();
        if (regional) params.append('regional', regional);
        if (kpiParam) params.append('kpi', kpiParam);
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
                // Mostrar mensagem de erro usando um elemento que ainda existe
                const statusMensagemAnalise = document.getElementById('statusMensagemAnalise');
                if (statusMensagemAnalise) {
                    statusMensagemAnalise.textContent = errorMessage;
                    statusMensagemAnalise.className = 'text-danger';
                } else {
                    console.error(errorMessage);
                }
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
                header.innerHTML = `<h6 class="mb-0"><i class="fas fa-chart-line"></i> ${regional}</h6>`;

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

    // Carrega os dados automaticamente quando a página é carregada
    // Somente se a aba de análise estiver visível (ativa)
    if (document.querySelector('#analise') && document.querySelector('#analise').classList.contains('active')) {
        loadAnalysisData();
    } else {
        // Se a aba de análise não estiver ativa, carrega os dados assim mesmo
        // pois agora só temos a aba de análise
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
        
        // Limpar todos os checkboxes de KPI
        document.querySelectorAll('.kpi-checkbox').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // Atualizar o estado do checkbox "Selecionar Todos"
        document.getElementById('selectAllKPI').checked = false;
        
        // Atualizar o texto do dropdown
        document.getElementById('filtroKPISelecionados').textContent = 'Nenhum KPI selecionado';

        // Definir o mês atual como padrão
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
        filtroMes.value = `${currentYear}-${currentMonth}`;

        // Marcar automaticamente os KPIs padrão após limpar
        const kpisPadrao = ['KPI', 'EXP_LM', 'EXP_SLM_CLIENTE'];
        kpisPadrao.forEach(kpi => {
            const checkbox = document.getElementById(`kpi_${kpi}`);
            if (checkbox) {
                checkbox.checked = true;
                // Disparar o evento change para atualizar a interface
                checkbox.dispatchEvent(new Event('change'));
            }
        });

        // Carregar os dados com os filtros limpos (mas com os KPIs padrão selecionados)
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
                const container = document.getElementById('kpiCheckboxes');
                container.innerHTML = '';
                
                // Definir os KPIs prioritários que devem aparecer primeiro
                const kpisPrioritarios = ['KPI', 'EXP_LM', 'EXP_SLM_CLIENTE'];
                
                // Primeiro, adicionar os KPIs prioritários
                kpisPrioritarios.forEach(item => {
                    if (data.includes(item)) { // Apenas se o item existir nos dados
                        const li = document.createElement('li');
                        li.innerHTML = `
                            <div class="dropdown-item">
                                <div class="form-check">
                                    <input class="form-check-input kpi-checkbox" type="checkbox" id="kpi_${item}" value="${item}">
                                    <label class="form-check-label" for="kpi_${item}">
                                        ${item}
                                    </label>
                                </div>
                            </div>
                        `;
                        container.appendChild(li);
                    }
                });
                
                // Depois, adicionar os demais KPIs que não estão na lista prioritária
                data.forEach(item => {
                    if (item && !kpisPrioritarios.includes(item)) { // Verificar se o valor não é nulo ou vazio e não está na lista prioritária
                        const li = document.createElement('li');
                        li.innerHTML = `
                            <div class="dropdown-item">
                                <div class="form-check">
                                    <input class="form-check-input kpi-checkbox" type="checkbox" id="kpi_${item}" value="${item}">
                                    <label class="form-check-label" for="kpi_${item}">
                                        ${item}
                                    </label>
                                </div>
                            </div>
                        `;
                        container.appendChild(li);
                    }
                });
                
                // Adicionar evento para o checkbox "Selecionar Todos"
                document.getElementById('selectAllKPI').addEventListener('change', function() {
                    const checkboxes = document.querySelectorAll('.kpi-checkbox');
                    checkboxes.forEach(checkbox => {
                        checkbox.checked = this.checked;
                    });
                    
                    updateKPISelectionDisplay();
                });
                
                // Adicionar evento para clicar em toda a área do item "Selecionar Todos"
                const selectAllItem = document.querySelector('#filtroKPIOptions .dropdown-item');
                if (selectAllItem) {
                    selectAllItem.addEventListener('click', function(e) {
                        // Verificar se o clique foi diretamente no item e não em um input ou label
                        if (e.target === this || e.target.classList.contains('form-check')) {
                            // Alternar o checkbox "Selecionar Todos"
                            const selectAllCheckbox = this.querySelector('.form-check-input');
                            if (selectAllCheckbox) {
                                selectAllCheckbox.checked = !selectAllCheckbox.checked;
                                
                                // Atualizar todos os outros checkboxes com o mesmo estado
                                const checkboxes = document.querySelectorAll('.kpi-checkbox');
                                checkboxes.forEach(checkbox => {
                                    checkbox.checked = selectAllCheckbox.checked;
                                    
                                    // Disparar o evento change para cada checkbox para atualizar a interface
                                    checkbox.dispatchEvent(new Event('change'));
                                });
                                
                                // Disparar o evento change para o checkbox "Selecionar Todos" também
                                selectAllCheckbox.dispatchEvent(new Event('change'));
                            }
                        }
                        e.stopPropagation(); // Impede que o evento propague e feche o dropdown
                    });
                }
                
                // Adicionar eventos para os checkboxes individuais
                document.querySelectorAll('.kpi-checkbox').forEach(checkbox => {
                    checkbox.addEventListener('change', function(e) {
                        e.stopPropagation(); // Impede que o evento propague e feche o dropdown
                        updateKPISelectionDisplay();
                        
                        // Atualizar o estado do checkbox "Selecionar Todos"
                        const allCheckboxes = document.querySelectorAll('.kpi-checkbox');
                        const allChecked = Array.from(allCheckboxes).every(cb => cb.checked);
                        const selectAllCheckbox = document.getElementById('selectAllKPI');
                        selectAllCheckbox.checked = allChecked;
                    });
                });
                
                // Impedir que o dropdown feche ao clicar nos labels
                document.querySelectorAll('#kpiCheckboxes label').forEach(label => {
                    label.addEventListener('click', function(e) {
                        e.stopPropagation(); // Impede que o evento propague e feche o dropdown
                    });
                });
                
                // Adicionar evento para clicar em toda a área do item do dropdown
                document.querySelectorAll('#kpiCheckboxes .dropdown-item').forEach(item => {
                    item.addEventListener('click', function(e) {
                        // Verificar se o clique foi diretamente no item e não em um input ou label
                        if (e.target === this || e.target.classList.contains('form-check')) {
                            // Alternar o checkbox correspondente
                            const checkbox = this.querySelector('.form-check-input');
                            if (checkbox) {
                                checkbox.checked = !checkbox.checked;
                                // Disparar o evento change para atualizar a interface
                                checkbox.dispatchEvent(new Event('change'));
                            }
                        }
                        e.stopPropagation(); // Impede que o evento propague e feche o dropdown
                    });
                });
                
                // Inicializar o texto do dropdown
                updateKPISelectionDisplay();
                
                // Marcar automaticamente os KPIs específicos
                const kpisPadrao = ['KPI', 'EXP_LM', 'EXP_SLM_CLIENTE'];
                kpisPadrao.forEach(kpi => {
                    const checkbox = document.getElementById(`kpi_${kpi}`);
                    if (checkbox) {
                        checkbox.checked = true;
                        // Disparar o evento change para atualizar a interface
                        checkbox.dispatchEvent(new Event('change'));
                    }
                });
            })
            .fail(function(error) {
                console.error('Erro ao carregar opções de KPI:', error);
            });
    }
    
    // Função para atualizar o texto do dropdown de KPI
    function updateKPISelectionDisplay() {
        const selectedCheckboxes = document.querySelectorAll('.kpi-checkbox:checked');
        const totalCheckboxes = document.querySelectorAll('.kpi-checkbox');
        
        const selectedValues = Array.from(selectedCheckboxes).map(cb => cb.value);
        
        if (selectedValues.length === 0) {
            document.getElementById('filtroKPISelecionados').textContent = 'Nenhum KPI selecionado';
        } else if (selectedValues.length === totalCheckboxes.length) {
            document.getElementById('filtroKPISelecionados').textContent = 'Todos os KPIs';
        } else {
            document.getElementById('filtroKPISelecionados').textContent = `${selectedValues.length} KPI(s) selecionado(s)`;
        }
    }

    // Carregar opções de filtros quando a aba de análise for mostrada
    const analiseTab = document.querySelector('#analise-tab');
    if (analiseTab) {
        analiseTab.addEventListener('shown.bs.tab', function() {
            loadFilterOptions();
        });
    }

    // Carregar opções de filtros quando a página é carregada
    loadFilterOptions();
    
    // Configurar o dropdown de KPI para não fechar automaticamente
    // Encontrar o dropdown de KPI e configurar para não fechar automaticamente
    const kpiDropdownElement = document.getElementById('filtroKPIdropdown');
    if (kpiDropdownElement) {
        // Destruir instância existente se houver
        const existingInstance = bootstrap.Dropdown.getInstance(kpiDropdownElement);
        if (existingInstance) {
            existingInstance.dispose();
        }

        // Criar nova instância com autoClose: false
        new bootstrap.Dropdown(kpiDropdownElement, {
            autoClose: false
        });
    }

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