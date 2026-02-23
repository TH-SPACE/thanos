/**
 * Módulo de download da base de dados B2B
 * Responsável por exportar os dados filtrados em formato Excel
 */

// Função principal para iniciar o download
function downloadBaseB2B() {
    // Obter valores dos filtros
    const regional = document.getElementById('filtroRegional').value;
    const segmento = document.getElementById('filtroSegmento').value;
    const mesAno = document.getElementById('filtroMes').value;

    // Obter os KPIs selecionados
    const selectedKPIs = Array.from(document.querySelectorAll('.kpi-checkbox:checked'))
        .map(cb => cb.value);
    const kpiParam = selectedKPIs.length > 0 ? selectedKPIs.join(',') : '';

    // Construir parâmetros da URL
    const params = new URLSearchParams();
    if (regional) params.append('regional', regional);
    if (segmento) params.append('segmento', segmento);
    if (kpiParam) params.append('kpi', kpiParam);
    if (mesAno) params.append('mes_ano', mesAno);

    // Criar URL de download
    const downloadUrl = `/b2b/exportar-dados?${params.toString()}`;

    // Mostrar feedback visual
    mostrarFeedbackDownload(true);

    // Realizar o download
    fetch(downloadUrl, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erro ao exportar dados');
        }
        return response.blob();
    })
    .then(blob => {
        // Criar link temporário para download
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // Gerar nome do arquivo com base nos filtros e data/hora
        const nomeArquivo = gerarNomeArquivo(regional, segmento, mesAno);
        a.download = nomeArquivo;
        
        // Adicionar ao DOM e clicar
        document.body.appendChild(a);
        a.click();
        
        // Limpeza
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        mostrarFeedbackDownload(false);
    })
    .catch(error => {
        console.error('Erro no download:', error);
        mostrarFeedbackDownload(false, true);
        alert('Erro ao baixar o arquivo. Tente novamente.');
    });
}

// Função para gerar nome do arquivo com base nos filtros
function gerarNomeArquivo(regional, segmento, mesAno) {
    const dataHora = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    let partes = ['B2B'];

    if (regional) {
        partes.push(regional.replace(/\s+/g, '_'));
    }

    if (segmento) {
        partes.push(segmento);
    }

    if (mesAno) {
        partes.push(mesAno.replace('-', '_'));
    }

    partes.push(dataHora);

    return `${partes.join('_')}.xlsx`;
}

// Função para mostrar feedback visual durante o download
function mostrarFeedbackDownload(iniciando, erro = false) {
    const btnDownload = document.getElementById('btnDownload');
    
    if (!btnDownload) return;

    if (iniciando) {
        btnDownload.disabled = true;
        btnDownload.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Baixando...';
        btnDownload.classList.remove('btn-outline-success');
        btnDownload.classList.add('btn-outline-primary');
    } else {
        btnDownload.disabled = false;
        
        if (erro) {
            btnDownload.innerHTML = '<i class="fas fa-times"></i> Erro';
            btnDownload.classList.remove('btn-outline-primary');
            btnDownload.classList.add('btn-outline-danger');
            
            // Restaurar após 3 segundos
            setTimeout(() => {
                btnDownload.innerHTML = '<i class="fas fa-download"></i> Download';
                btnDownload.classList.remove('btn-outline-danger');
                btnDownload.classList.add('btn-outline-success');
            }, 3000);
        } else {
            btnDownload.innerHTML = '<i class="fas fa-check"></i> Download concluído!';
            btnDownload.classList.remove('btn-outline-primary');
            btnDownload.classList.add('btn-outline-success');
            
            // Restaurar após 3 segundos
            setTimeout(() => {
                btnDownload.innerHTML = '<i class="fas fa-download"></i> Download';
                btnDownload.classList.remove('btn-outline-success');
                btnDownload.classList.add('btn-outline-primary');
            }, 3000);
        }
    }
}

// Função para inicializar o botão de download
function inicializarBotaoDownload() {
    const btnDownload = document.getElementById('btnDownload');
    
    if (btnDownload) {
        btnDownload.addEventListener('click', downloadBaseB2B);
    }
}

// Exportar funções para uso global
window.downloadBaseB2B = downloadBaseB2B;
window.inicializarBotaoDownload = inicializarBotaoDownload;
