// Variáveis globais
let map = null;
let markers = [];
let rawData = [];

// Inicializar o mapa
function initMap() {
    // Coordenadas aproximadas do centro do Brasil
    const brasilCoords = [-14.2350, -51.9253];
    
    // Criar o mapa
    map = L.map('map').setView(brasilCoords, 4);

    // Adicionar camada do OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Adicionar evento para mudança no tipo de visualização
    document.getElementById('viewType').addEventListener('change', function() {
        if (rawData.length > 0) {
            clearMarkers();
            displayOnMap(rawData);
        }
    });
}

// Função para carregar o arquivo XLSX
document.getElementById('uploadBtn').addEventListener('click', function() {
    const fileInput = document.getElementById('excelFile');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Por favor, selecione um arquivo XLSX primeiro.');
        return;
    }
    
    const formData = new FormData();
    formData.append('excelFile', file);
    
    fetch('/mapab2b/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        rawData = data;
        processDataAndDisplay(rawData);
    })
    .catch(error => {
        console.error('Erro ao carregar o arquivo:', error);
        alert('Erro ao processar o arquivo XLSX');
    });
});

// Processar dados e exibir no mapa
function processDataAndDisplay(data) {
    // Limpar marcadores antigos
    clearMarkers();
    
    // Atualizar filtros
    updateFilters(data);
    
    // Exibir dados no mapa
    displayOnMap(data);
    
    // Atualizar tabela resumo
    updateSummaryTable(data);
}

// Atualizar os filtros com opções únicas
function updateFilters(data) {
    const ufSelect = document.getElementById('ufFilter');
    const tipoSelect = document.getElementById('tipoFilter');
    
    // Limpar opções anteriores
    ufSelect.innerHTML = '<option value="">Todas as UFs</option>';
    tipoSelect.innerHTML = '<option value="">Todos os Tipos</option>';
    
    // Obter valores únicos
    const ufs = [...new Set(data.map(item => item.UF))].filter(uf => uf);
    const tipos = [...new Set(data.map(item => item.TIPO))].filter(tipo => tipo);
    
    // Adicionar opções aos selects
    ufs.forEach(uf => {
        const option = document.createElement('option');
        option.value = uf;
        option.textContent = uf;
        ufSelect.appendChild(option);
    });
    
    tipos.forEach(tipo => {
        const option = document.createElement('option');
        option.value = tipo;
        option.textContent = tipo;
        tipoSelect.appendChild(option);
    });
    
    // Adicionar eventos de filtro
    ufSelect.addEventListener('change', filterData);
    tipoSelect.addEventListener('change', filterData);
}

// Filtrar dados com base nos selects
function filterData() {
    const ufValue = document.getElementById('ufFilter').value;
    const tipoValue = document.getElementById('tipoFilter').value;
    
    let filteredData = rawData;
    
    if (ufValue) {
        filteredData = filteredData.filter(item => item.UF === ufValue);
    }
    
    if (tipoValue) {
        filteredData = filteredData.filter(item => item.TIPO === tipoValue);
    }
    
    // Limpar marcadores e adicionar os filtrados
    clearMarkers();
    displayOnMap(filteredData);
    
    // Atualizar tabela resumo
    updateSummaryTable(filteredData);
    
    // Zoom automático para a UF selecionada
    if (ufValue) {
        zoomToUf(ufValue, filteredData);
    } else {
        // Voltar para a visão geral do Brasil
        map.setView([-14.2350, -51.9253], 4);
    }
}

// Exibir dados no mapa
function displayOnMap(data) {
    const viewType = document.getElementById('viewType').value;
    
    if (viewType === 'heatmap') {
        // Modo heatmap - exibir círculos com borda vermelha e preenchimento transparente
        data.forEach(item => {
            const lat = parseFloat(item.latitude) || parseFloat(item.LAT) || parseFloat(item.Latitude) || -14.2350; // Valor padrão
            const lon = parseFloat(item.longitude) || parseFloat(item.LON) || parseFloat(item.Longitude) || -51.9253; // Valor padrão
            
            // Verificar se temos coordenadas válidas
            if (isNaN(lat) || isNaN(lon)) {
                console.warn('Coordenadas inválidas para item:', item);
                return;
            }
            
            // Usar o número de BDs para determinar o raio e opacidade do círculo
            const bds = item.BDs || 0;
            
            // Somente mostrar círculos para locais com BDs
            if (bds > 0) {
                // Calcular raio proporcional ao número de BDs (com limite máximo)
                const radius = Math.min(bds * 1000, 50000); // Limitar tamanho máximo
                
                // Calcular opacidade baseada no número de BDs
                const opacity = Math.min(bds / 20, 0.7); // Aumentar opacidade com mais BDs, mas limitar
                
                // Criar círculo com borda vermelha e preenchimento transparente
                const circle = L.circle([lat, lon], {
                    radius: radius,
                    color: '#dc3545', // Cor da borda (vermelho bootstrap)
                    fillColor: '#ffcccc', // Cor de preenchimento (vermelho claro)
                    fillOpacity: opacity * 0.3, // Preenchimento mais transparente
                    weight: 2
                }).addTo(map);
                
                // Adicionar tooltip com informações
                let tooltipContent = '<div class="tooltip-info">';
                tooltipContent += `<div><strong>Cidade:</strong> ${item.CIDADE_ATUALIAZADA || item.CIDADE || 'Desconhecida'}</div>`;
                tooltipContent += `<div><strong>UF:</strong> ${item.UF || 'Desconhecida'}</div>`;
                tooltipContent += `<div><strong>BDs:</strong> ${bds}</div>`;
                tooltipContent += `<div><strong>Plantas:</strong> ${item.PLANTA || 0}</div>`;
                tooltipContent += '</div>';
                
                circle.bindTooltip(tooltipContent, { permanent: false, direction: 'top' });
                
                // Armazenar círculo para possível limpeza futura
                markers.push(circle);
            }
        });
    } else {
        // Modo marcadores normais
        data.forEach(item => {
            // Para este caso específico, as colunas são "latitude" e "longitude"
            const lat = parseFloat(item.latitude) || parseFloat(item.LAT) || parseFloat(item.Latitude) || -14.2350; // Valor padrão
            const lon = parseFloat(item.longitude) || parseFloat(item.LON) || parseFloat(item.Longitude) || -51.9253; // Valor padrão
            
            // Verificar se temos coordenadas válidas
            if (isNaN(lat) || isNaN(lon)) {
                console.warn('Coordenadas inválidas para item:', item);
                return;
            }
            
            // Criar conteúdo para o tooltip
            let tooltipContent = '<div class="tooltip-info">';
            
            // Adicionar todas as propriedades do item ao tooltip, exceto latitude e longitude
            Object.keys(item).forEach(key => {
                if (key !== 'latitude' && key !== 'longitude' && 
                    key !== 'LAT' && key !== 'LON' && 
                    key !== 'Latitude' && key !== 'Longitude') {
                    tooltipContent += `<div><strong>${key}:</strong> ${item[key]}</div>`;
                }
            });
            
            tooltipContent += '</div>';
            
            // Adicionar marcador ao mapa
            const marker = L.marker([lat, lon]).addTo(map);
            marker.bindTooltip(tooltipContent, { permanent: false, direction: 'top' });
            
            // Armazenar marcador para possível limpeza futura
            markers.push(marker);
        });
    }
}

// Limpar marcadores do mapa
function clearMarkers() {
    // Remover marcadores/círculos
    markers.forEach(marker => {
        map.removeLayer(marker);
    });
    markers = [];
}

// Função para aplicar zoom automático para uma UF específica
function zoomToUf(uf, data) {
    // Filtrar coordenadas válidas para a UF
    const coords = data
        .map(item => {
            const lat = parseFloat(item.latitude) || parseFloat(item.LAT) || parseFloat(item.Latitude);
            const lon = parseFloat(item.longitude) || parseFloat(item.LON) || parseFloat(item.Longitude);
            return { lat, lon };
        })
        .filter(coord => !isNaN(coord.lat) && !isNaN(coord.lon));
    
    if (coords.length > 0) {
        // Criar bounds com as coordenadas
        const bounds = L.latLngBounds(coords.map(coord => [coord.lat, coord.lon]));
        
        // Aplicar o zoom para os limites da UF
        map.fitBounds(bounds, {
            padding: [50, 50],
            maxZoom: 8
        });
    }
}

// Atualizar tabela resumo
function updateSummaryTable(data) {
    const tbody = document.querySelector('#summaryTable tbody');
    tbody.innerHTML = '';

    // Obter valor do filtro de UF para determinar o modo de exibição
    const ufValue = document.getElementById('ufFilter').value;

    if (ufValue) {
        // Modo detalhado: mostrar cidades, plantas e BDs para a UF selecionada
        const filteredData = data.filter(item => item.UF === ufValue);
        
        // Classificar por volume de BDs (decrescente)
        filteredData.sort((a, b) => (b.BDs || 0) - (a.BDs || 0));
        
        // Adicionar classe CSS para tabela com 3 colunas
        const table = document.getElementById('summaryTable');
        table.className = 'col3';
        
        // Adicionar linhas à tabela com detalhes
        filteredData.forEach(item => {
            const row = document.createElement('tr');

            const cidadeCell = document.createElement('td');
            cidadeCell.textContent = item.CIDADE_ATUALIAZADA || item.CIDADE || 'Desconhecido';

            const plantaCell = document.createElement('td');
            plantaCell.textContent = item.PLANTA || 0;

            const bdsCell = document.createElement('td');
            bdsCell.textContent = item.BDs || 0;

            row.appendChild(cidadeCell);
            row.appendChild(plantaCell);
            row.appendChild(bdsCell);

            tbody.appendChild(row);
        });
        
        // Atualizar cabeçalho da tabela
        const thead = document.querySelector('#summaryTable thead tr');
        thead.innerHTML = '';
        const headers = ['Cidade', 'Planta', 'BDs'];
        headers.forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText;
            thead.appendChild(th);
        });
    } else {
        // Modo geral: agrupar por UF como antes
        const groupedByUf = data.reduce((acc, item) => {
            const uf = item.UF || 'Desconhecido';
            if (!acc[uf]) {
                acc[uf] = { count: 0, totalPlantas: 0, totalBDs: 0 };
            }
            acc[uf].count++;
            acc[uf].totalPlantas += item.PLANTA || 0;
            acc[uf].totalBDs += item.BDs || 0;
            return acc;
        }, {});

        // Remover classe CSS específica para tabela com 3 colunas
        const table = document.getElementById('summaryTable');
        table.className = '';
        
        // Converter objeto em array e ordenar por UF
        const sortedUfs = Object.entries(groupedByUf).sort((a, b) => a[0].localeCompare(b[0]));

        // Adicionar linhas à tabela
        sortedUfs.forEach(([uf, data]) => {
            const row = document.createElement('tr');

            const ufCell = document.createElement('td');
            ufCell.textContent = uf;

            const countCell = document.createElement('td');
            countCell.textContent = data.count;

            row.appendChild(ufCell);
            row.appendChild(countCell);

            tbody.appendChild(row);
        });
        
        // Atualizar cabeçalho da tabela
        const thead = document.querySelector('#summaryTable thead tr');
        thead.innerHTML = '';
        const headers = ['UF', 'Total Cidades'];
        headers.forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText;
            thead.appendChild(th);
        });
    }
}

// Função para carregar dados automaticamente
function loadLastData() {
    fetch('/mapab2b/data')
        .then(response => response.json())
        .then(data => {
            if (data && data.length > 0) {
                rawData = data;
                processDataAndDisplay(rawData);
                console.log('Dados do último upload carregados automaticamente');
            } else {
                console.log('Nenhum dado disponível do último upload');
            }
        })
        .catch(error => {
            console.error('Erro ao carregar dados do último upload:', error);
        });
}

// Inicializar o mapa quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    initMap();
    // Carregar dados do último upload automaticamente
    loadLastData();
});