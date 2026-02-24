// Variáveis globais
let map = null;
let markers = [];
let rawData = [];
let statesLayer = null;
let highlightedStates = new Set();

// Carregar fronteiras dos estados
function loadStateBoundaries() {
  return fetch(
    "https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/brazil-states.geojson",
  )
    .then((response) => response.json())
    .then((geojson) => {
      statesLayer = L.geoJSON(geojson, {
        style: {
          color: "#d6d6d6",
          weight: 1,
          opacity: 0.8,
          fillOpacity: 0.4,
          fillColor: "#d0d0d0",
        },
      }).addTo(map);
      return statesLayer;
    })
    .catch((error) => {
      console.error("Erro ao carregar fronteiras dos estados:", error);
      return null;
    });
}

// Destacar estados presentes na base de dados
function highlightStatesFromData(data) {
  // Limpar estados destacados anteriores
  highlightedStates.clear();

  // Obter UFs únicas da base
  data.forEach((item) => {
    if (item.UF) {
      highlightedStates.add(item.UF);
    }
  });

  console.log("Estados na base:", Array.from(highlightedStates));

  // Se já existe a camada de estados, atualizar o estilo
  if (statesLayer) {
    let count = 0;
    let countDestaque = 0;

    statesLayer.eachLayer((layer) => {
      const stateUF = layer.feature.properties.sigla;
      count++;

      if (highlightedStates.has(stateUF)) {
        countDestaque++;
        // Estado está na base: mostrar com destaque
        layer.setStyle({
          color: "#3854f3",
          weight: 0.8,
          opacity: 1,
          fillOpacity: 0.3,
          fillColor: "#afc5ff",
        });
      } else {
        // Estado NÃO está na base: cinza claro visível
        layer.setStyle({
          color: "#999999",
          weight: 1,
          opacity: 0.8,
          fillOpacity: 0.4,
          fillColor: "#d0d0d0",
        });
      }
    });

    console.log(`Total estados: ${count}, Destacados: ${countDestaque}`);
  }
}

// Inicializar o mapa
function initMap() {
  // Coordenadas aproximadas do centro do Brasil
  const brasilCoords = [-14.235, -51.9253];

  // Criar o mapa
  map = L.map("map").setView(brasilCoords, 4);

  // Adicionar camada do OpenStreetMap
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  // Carregar fronteiras dos estados
  loadStateBoundaries();

  // Adicionar evento para mudança no tipo de visualização
  document.getElementById("viewType").addEventListener("change", function () {
    if (rawData.length > 0) {
      clearMarkers();
      displayOnMap(rawData);
      highlightStatesFromData(rawData);
    }
  });
}

// Função para carregar o arquivo XLSX
document.getElementById("uploadBtn").addEventListener("click", function () {
  const fileInput = document.getElementById("excelFile");
  const file = fileInput.files[0];

  if (!file) {
    alert("Por favor, selecione um arquivo XLSX primeiro.");
    return;
  }

  const formData = new FormData();
  formData.append("excelFile", file);

  fetch("/mapab2b/upload", {
    method: "POST",
    body: formData,
  })
    .then((response) => response.json())
    .then((data) => {
      rawData = data;
      processDataAndDisplay(rawData);
    })
    .catch((error) => {
      console.error("Erro ao carregar o arquivo:", error);
      alert("Erro ao processar o arquivo XLSX");
    });
});

// Processar dados e exibir no mapa
function processDataAndDisplay(data) {
  // Limpar marcadores antigos
  clearMarkers();

  // Atualizar filtros
  updateFilters(data);

  // Destacar estados presentes na base
  highlightStatesFromData(data);

  // Exibir dados no mapa
  displayOnMap(data);

  // Atualizar tabela resumo
  updateSummaryTable(data);
}

// Atualizar os filtros com opções únicas
function updateFilters(data) {
  const ufSelect = document.getElementById("ufFilter");
  const tipoSelect = document.getElementById("tipoFilter");

  // Limpar opções anteriores
  ufSelect.innerHTML = '<option value="">Todas as UFs</option>';
  tipoSelect.innerHTML = '<option value="">Todos os Tipos</option>';

  // Obter valores únicos
  const ufs = [...new Set(data.map((item) => item.UF))].filter((uf) => uf);
  const tipos = [...new Set(data.map((item) => item.TIPO))].filter(
    (tipo) => tipo,
  );

  // Adicionar opções aos selects
  ufs.forEach((uf) => {
    const option = document.createElement("option");
    option.value = uf;
    option.textContent = uf;
    ufSelect.appendChild(option);
  });

  tipos.forEach((tipo) => {
    const option = document.createElement("option");
    option.value = tipo;
    option.textContent = tipo;
    tipoSelect.appendChild(option);
  });

  // Adicionar eventos de filtro
  ufSelect.addEventListener("change", filterData);
  tipoSelect.addEventListener("change", filterData);
}

// Filtrar dados com base nos selects
function filterData() {
  const ufValue = document.getElementById("ufFilter").value;
  const tipoValue = document.getElementById("tipoFilter").value;

  let filteredData = rawData;

  if (ufValue) {
    filteredData = filteredData.filter((item) => item.UF === ufValue);
  }

  if (tipoValue) {
    filteredData = filteredData.filter((item) => item.TIPO === tipoValue);
  }

  // Limpar marcadores e adicionar os filtrados
  clearMarkers();

  // Destacar estados filtrados
  highlightStatesFromData(filteredData);

  displayOnMap(filteredData);

  // Atualizar tabela resumo
  updateSummaryTable(filteredData);

  // Zoom automático para a UF selecionada
  if (ufValue) {
    zoomToUf(ufValue, filteredData);
  } else {
    // Voltar para a visão geral do Brasil
    map.setView([-14.235, -51.9253], 4);
  }
}

// Exibir dados no mapa
function displayOnMap(data) {
  const viewType = document.getElementById("viewType").value;

  if (viewType === "heatmap") {
    // Mancha de Calor - Roxo/Azul com borda branca
    data.forEach((item) => {
      const lat =
        parseFloat(item.latitude) ||
        parseFloat(item.LAT) ||
        parseFloat(item.Latitude) ||
        -14.235;
      const lon =
        parseFloat(item.longitude) ||
        parseFloat(item.LON) ||
        parseFloat(item.Longitude) ||
        -51.9253;

      if (isNaN(lat) || isNaN(lon)) {
        console.warn("Coordenadas inválidas para item:", item);
        return;
      }

      const bds = item.BDs || 0;
      if (bds > 0) {
        const maxRadius = Math.min(bds * 1500, 80000);
        const baseOpacity = Math.min(bds / 15, 0.95);

        const outerCircle = L.circle([lat, lon], {
          radius: maxRadius,
          color: "#85c1e9",
          fillColor: "#85c1e9",
          fillOpacity: baseOpacity * 0.3,
          weight: 0,
        }).addTo(map);

        const middleCircle = L.circle([lat, lon], {
          radius: maxRadius * 0.7,
          color: "#a569bd",
          fillColor: "#a569bd",
          fillOpacity: baseOpacity * 0.5,
          weight: 0,
        }).addTo(map);

        const innerCircle = L.circle([lat, lon], {
          radius: maxRadius * 0.45,
          color: "#ffffff",
          fillColor: "#9b59b6",
          fillOpacity: baseOpacity,
          weight: 1,
          opacity: 1,
        }).addTo(map);

        const tooltipContent = `<div class="tooltip-info">
                    <div><strong>Cidade:</strong> ${item.CIDADE_ATUALIAZADA || item.CIDADE || "Desconhecida"}</div>
                    <div><strong>UF:</strong> ${item.UF || "Desconhecida"}</div>
                    <div><strong>BDs:</strong> ${bds}</div>
                    <div><strong>Plantas:</strong> ${item.PLANTA || 0}</div>
                </div>`;

        innerCircle.bindTooltip(tooltipContent, {
          permanent: false,
          direction: "top",
        });
        markers.push(outerCircle, middleCircle, innerCircle);
      }
    });
  } else if (viewType === "heatmap-verde") {
    // Mancha de Calor - Verde
    data.forEach((item) => {
      const lat =
        parseFloat(item.latitude) ||
        parseFloat(item.LAT) ||
        parseFloat(item.Latitude) ||
        -14.235;
      const lon =
        parseFloat(item.longitude) ||
        parseFloat(item.LON) ||
        parseFloat(item.Longitude) ||
        -51.9253;

      if (isNaN(lat) || isNaN(lon)) return;

      const bds = item.BDs || 0;
      if (bds > 0) {
        const maxRadius = Math.min(bds * 1500, 80000);
        const baseOpacity = Math.min(bds / 15, 0.95);

        const outerCircle = L.circle([lat, lon], {
          radius: maxRadius,
          color: "#82e0aa",
          fillColor: "#82e0aa",
          fillOpacity: baseOpacity * 0.3,
          weight: 0,
        }).addTo(map);

        const middleCircle = L.circle([lat, lon], {
          radius: maxRadius * 0.7,
          color: "#2ecc71",
          fillColor: "#2ecc71",
          fillOpacity: baseOpacity * 0.5,
          weight: 0,
        }).addTo(map);

        const innerCircle = L.circle([lat, lon], {
          radius: maxRadius * 0.45,
          color: "#ffffff",
          fillColor: "#27ae60",
          fillOpacity: baseOpacity,
          weight: 1,
          opacity: 1,
        }).addTo(map);

        const tooltipContent = `<div class="tooltip-info">
                    <div><strong>Cidade:</strong> ${item.CIDADE_ATUALIAZADA || item.CIDADE || "Desconhecida"}</div>
                    <div><strong>UF:</strong> ${item.UF || "Desconhecida"}</div>
                    <div><strong>BDs:</strong> ${bds}</div>
                    <div><strong>Plantas:</strong> ${item.PLANTA || 0}</div>
                </div>`;

        innerCircle.bindTooltip(tooltipContent, {
          permanent: false,
          direction: "top",
        });
        markers.push(outerCircle, middleCircle, innerCircle);
      }
    });
  } else if (viewType === "heatmap-laranja") {
    // Mancha de Calor - Laranja/Vermelho
    data.forEach((item) => {
      const lat =
        parseFloat(item.latitude) ||
        parseFloat(item.LAT) ||
        parseFloat(item.Latitude) ||
        -14.235;
      const lon =
        parseFloat(item.longitude) ||
        parseFloat(item.LON) ||
        parseFloat(item.Longitude) ||
        -51.9253;

      if (isNaN(lat) || isNaN(lon)) return;

      const bds = item.BDs || 0;
      if (bds > 0) {
        const maxRadius = Math.min(bds * 1500, 80000);
        const baseOpacity = Math.min(bds / 15, 0.95);

        const outerCircle = L.circle([lat, lon], {
          radius: maxRadius,
          color: "#f5b041",
          fillColor: "#f5b041",
          fillOpacity: baseOpacity * 0.3,
          weight: 0,
        }).addTo(map);

        const middleCircle = L.circle([lat, lon], {
          radius: maxRadius * 0.7,
          color: "#e67e22",
          fillColor: "#e67e22",
          fillOpacity: baseOpacity * 0.5,
          weight: 0,
        }).addTo(map);

        const innerCircle = L.circle([lat, lon], {
          radius: maxRadius * 0.45,
          color: "#ffffff",
          fillColor: "#c0392b",
          fillOpacity: baseOpacity,
          weight: 1,
          opacity: 1,
        }).addTo(map);

        const tooltipContent = `<div class="tooltip-info">
                    <div><strong>Cidade:</strong> ${item.CIDADE_ATUALIAZADA || item.CIDADE || "Desconhecida"}</div>
                    <div><strong>UF:</strong> ${item.UF || "Desconhecida"}</div>
                    <div><strong>BDs:</strong> ${bds}</div>
                    <div><strong>Plantas:</strong> ${item.PLANTA || 0}</div>
                </div>`;

        innerCircle.bindTooltip(tooltipContent, {
          permanent: false,
          direction: "top",
        });
        markers.push(outerCircle, middleCircle, innerCircle);
      }
    });
  } else if (viewType === "heatmap-azul") {
    // Mancha de Calor - Azul
    data.forEach((item) => {
      const lat =
        parseFloat(item.latitude) ||
        parseFloat(item.LAT) ||
        parseFloat(item.Latitude) ||
        -14.235;
      const lon =
        parseFloat(item.longitude) ||
        parseFloat(item.LON) ||
        parseFloat(item.Longitude) ||
        -51.9253;

      if (isNaN(lat) || isNaN(lon)) return;

      const bds = item.BDs || 0;
      if (bds > 0) {
        const maxRadius = Math.min(bds * 1500, 80000);
        const baseOpacity = Math.min(bds / 15, 0.95);

        const outerCircle = L.circle([lat, lon], {
          radius: maxRadius,
          color: "#5dade2",
          fillColor: "#5dade2",
          fillOpacity: baseOpacity * 0.3,
          weight: 0,
        }).addTo(map);

        const middleCircle = L.circle([lat, lon], {
          radius: maxRadius * 0.7,
          color: "#2e86c1",
          fillColor: "#2e86c1",
          fillOpacity: baseOpacity * 0.5,
          weight: 0,
        }).addTo(map);

        const innerCircle = L.circle([lat, lon], {
          radius: maxRadius * 0.45,
          color: "#ffffff",
          fillColor: "#1b4f72",
          fillOpacity: baseOpacity,
          weight: 1,
          opacity: 1,
        }).addTo(map);

        const tooltipContent = `<div class="tooltip-info">
                    <div><strong>Cidade:</strong> ${item.CIDADE_ATUALIAZADA || item.CIDADE || "Desconhecida"}</div>
                    <div><strong>UF:</strong> ${item.UF || "Desconhecida"}</div>
                    <div><strong>BDs:</strong> ${bds}</div>
                    <div><strong>Plantas:</strong> ${item.PLANTA || 0}</div>
                </div>`;

        innerCircle.bindTooltip(tooltipContent, {
          permanent: false,
          direction: "top",
        });
        markers.push(outerCircle, middleCircle, innerCircle);
      }
    });
  } else if (viewType === "heatmap-arcoiris") {
    // Mancha de Calor - Arco-Íris
    data.forEach((item) => {
      const lat =
        parseFloat(item.latitude) ||
        parseFloat(item.LAT) ||
        parseFloat(item.Latitude) ||
        -14.235;
      const lon =
        parseFloat(item.longitude) ||
        parseFloat(item.LON) ||
        parseFloat(item.Longitude) ||
        -51.9253;

      if (isNaN(lat) || isNaN(lon)) return;

      const bds = item.BDs || 0;
      if (bds > 0) {
        const maxRadius = Math.min(bds * 1500, 80000);
        const baseOpacity = Math.min(bds / 15, 0.95);

        const outerCircle = L.circle([lat, lon], {
          radius: maxRadius,
          color: "#9b59b6",
          fillColor: "#9b59b6",
          fillOpacity: baseOpacity * 0.3,
          weight: 0,
        }).addTo(map);

        const middleCircle = L.circle([lat, lon], {
          radius: maxRadius * 0.7,
          color: "#2ecc71",
          fillColor: "#2ecc71",
          fillOpacity: baseOpacity * 0.5,
          weight: 0,
        }).addTo(map);

        const innerCircle = L.circle([lat, lon], {
          radius: maxRadius * 0.45,
          color: "#ffffff",
          fillColor: "#e74c3c",
          fillOpacity: baseOpacity,
          weight: 1,
          opacity: 1,
        }).addTo(map);

        const tooltipContent = `<div class="tooltip-info">
                    <div><strong>Cidade:</strong> ${item.CIDADE_ATUALIAZADA || item.CIDADE || "Desconhecida"}</div>
                    <div><strong>UF:</strong> ${item.UF || "Desconhecida"}</div>
                    <div><strong>BDs:</strong> ${bds}</div>
                    <div><strong>Plantas:</strong> ${item.PLANTA || 0}</div>
                </div>`;

        innerCircle.bindTooltip(tooltipContent, {
          permanent: false,
          direction: "top",
        });
        markers.push(outerCircle, middleCircle, innerCircle);
      }
    });
  } else if (viewType === "clusters") {
    // Agrupamento (Clusters)
    const clusterGroup = L.markerClusterGroup({
      showCoverageOnHover: true,
      zoomToBoundsOnClick: true,
      spiderfyOnMaxZoom: true,
    });

    data.forEach((item) => {
      const lat =
        parseFloat(item.latitude) ||
        parseFloat(item.LAT) ||
        parseFloat(item.Latitude) ||
        -14.235;
      const lon =
        parseFloat(item.longitude) ||
        parseFloat(item.LON) ||
        parseFloat(item.Longitude) ||
        -51.9253;

      if (isNaN(lat) || isNaN(lon)) return;

      const tooltipContent = `<div class="tooltip-info">
                <div><strong>Cidade:</strong> ${item.CIDADE_ATUALIAZADA || item.CIDADE || "Desconhecida"}</div>
                <div><strong>UF:</strong> ${item.UF || "Desconhecida"}</div>
                <div><strong>BDs:</strong> ${item.BDs || 0}</div>
                <div><strong>Plantas:</strong> ${item.PLANTA || 0}</div>
            </div>`;

      const marker = L.marker([lat, lon]);
      marker.bindTooltip(tooltipContent, {
        permanent: false,
        direction: "top",
      });
      clusterGroup.addLayer(marker);
      markers.push(marker);
    });

    map.addLayer(clusterGroup);
    markers.push(clusterGroup);
  } else if (viewType === "circulos") {
    // Círculos Proporcionais
    data.forEach((item) => {
      const lat =
        parseFloat(item.latitude) ||
        parseFloat(item.LAT) ||
        parseFloat(item.Latitude) ||
        -14.235;
      const lon =
        parseFloat(item.longitude) ||
        parseFloat(item.LON) ||
        parseFloat(item.Longitude) ||
        -51.9253;

      if (isNaN(lat) || isNaN(lon)) return;

      const bds = item.BDs || 0;
      if (bds > 0) {
        const radius = Math.min(bds * 800, 40000);
        const intensity = Math.min(bds / 30, 1);

        let fillColor;
        if (intensity < 0.5) {
          fillColor = `rgb(${Math.floor(255 * (1 - intensity * 2))}, 255, 0)`;
        } else {
          fillColor = `rgb(255, ${Math.floor(255 * (2 - intensity * 2))}, 0)`;
        }

        const circle = L.circle([lat, lon], {
          radius: radius,
          color: "#ffffff",
          fillColor: fillColor,
          fillOpacity: 0.7,
          weight: 2,
        }).addTo(map);

        const tooltipContent = `<div class="tooltip-info">
                    <div><strong>Cidade:</strong> ${item.CIDADE_ATUALIAZADA || item.CIDADE || "Desconhecida"}</div>
                    <div><strong>UF:</strong> ${item.UF || "Desconhecida"}</div>
                    <div><strong>BDs:</strong> ${bds}</div>
                    <div><strong>Plantas:</strong> ${item.PLANTA || 0}</div>
                </div>`;

        circle.bindTooltip(tooltipContent, {
          permanent: false,
          direction: "top",
        });
        markers.push(circle);
      }
    });
  } else if (viewType === "quadrantes") {
    // Quadrantes de Densidade
    const densityLevels = [];

    data.forEach((item) => {
      const lat =
        parseFloat(item.latitude) ||
        parseFloat(item.LAT) ||
        parseFloat(item.Latitude) ||
        -14.235;
      const lon =
        parseFloat(item.longitude) ||
        parseFloat(item.LON) ||
        parseFloat(item.Longitude) ||
        -51.9253;

      if (isNaN(lat) || isNaN(lon)) return;

      densityLevels.push({ lat, lon, bds: item.BDs || 0, item });
    });

    densityLevels.sort((a, b) => b.bds - a.bds);

    const q1 = Math.floor(densityLevels.length * 0.25);
    const q2 = Math.floor(densityLevels.length * 0.5);
    const q3 = Math.floor(densityLevels.length * 0.75);

    densityLevels.forEach((data, index) => {
      let color, fillOpacity, radius, densidadeLabel;

      if (index < q1) {
        color = "#c0392b";
        fillOpacity = 0.8;
        radius = Math.min(data.bds * 1200, 60000);
        densidadeLabel = "Muito Alta";
      } else if (index < q2) {
        color = "#e67e22";
        fillOpacity = 0.6;
        radius = Math.min(data.bds * 1000, 50000);
        densidadeLabel = "Alta";
      } else if (index < q3) {
        color = "#f1c40f";
        fillOpacity = 0.5;
        radius = Math.min(data.bds * 800, 40000);
        densidadeLabel = "Média";
      } else {
        color = "#27ae60";
        fillOpacity = 0.4;
        radius = Math.min(data.bds * 600, 30000);
        densidadeLabel = "Baixa";
      }

      const circle = L.circle([data.lat, data.lon], {
        radius: radius,
        color: color,
        fillColor: color,
        fillOpacity: fillOpacity,
        weight: 2,
      }).addTo(map);

      const tooltipContent = `<div class="tooltip-info">
                <div><strong>Cidade:</strong> ${data.item.CIDADE_ATUALIAZADA || data.item.CIDADE || "Desconhecida"}</div>
                <div><strong>UF:</strong> ${data.item.UF || "Desconhecida"}</div>
                <div><strong>BDs:</strong> ${data.bds}</div>
                <div><strong>Plantas:</strong> ${data.item.PLANTA || 0}</div>
                <div><strong>Densidade:</strong> ${densidadeLabel}</div>
            </div>`;

      circle.bindTooltip(tooltipContent, {
        permanent: false,
        direction: "top",
      });
      markers.push(circle);
    });
  } else if (viewType === "densidade-vermelho") {
    // Densidade - Vermelho (4 níveis de intensidade)
    const densityLevels = [];

    data.forEach((item) => {
      const lat =
        parseFloat(item.latitude) ||
        parseFloat(item.LAT) ||
        parseFloat(item.Latitude) ||
        -14.235;
      const lon =
        parseFloat(item.longitude) ||
        parseFloat(item.LON) ||
        parseFloat(item.Longitude) ||
        -51.9253;

      if (isNaN(lat) || isNaN(lon)) return;

      densityLevels.push({ lat, lon, bds: item.BDs || 0, item });
    });

    densityLevels.sort((a, b) => b.bds - a.bds);

    const q1 = Math.floor(densityLevels.length * 0.25);
    const q2 = Math.floor(densityLevels.length * 0.5);
    const q3 = Math.floor(densityLevels.length * 0.75);

    densityLevels.forEach((data, index) => {
      let color, fillOpacity, radius, densidadeLabel;

      if (index < q1) {
        color = "#c0392b";
        fillOpacity = 0.9;
        radius = Math.min(data.bds * 1200, 60000);
        densidadeLabel = "Muito Alta";
      } else if (index < q2) {
        color = "#e74c3c";
        fillOpacity = 0.7;
        radius = Math.min(data.bds * 1000, 50000);
        densidadeLabel = "Alta";
      } else if (index < q3) {
        color = "#ec7063";
        fillOpacity = 0.5;
        radius = Math.min(data.bds * 800, 40000);
        densidadeLabel = "Média";
      } else {
        color = "#f1948a";
        fillOpacity = 0.3;
        radius = Math.min(data.bds * 600, 30000);
        densidadeLabel = "Baixa";
      }

      const circle = L.circle([data.lat, data.lon], {
        radius: radius,
        color: color,
        fillColor: color,
        fillOpacity: fillOpacity,
        weight: 0,
      }).addTo(map);

      const tooltipContent = `<div class="tooltip-info">
                <div><strong>Cidade:</strong> ${data.item.CIDADE_ATUALIAZADA || data.item.CIDADE || "Desconhecida"}</div>
                <div><strong>UF:</strong> ${data.item.UF || "Desconhecida"}</div>
                <div><strong>BDs:</strong> ${data.bds}</div>
                <div><strong>Plantas:</strong> ${data.item.PLANTA || 0}</div>
                <div><strong>Densidade:</strong> ${densidadeLabel}</div>
            </div>`;

      circle.bindTooltip(tooltipContent, {
        permanent: false,
        direction: "top",
      });
      markers.push(circle);
    });
  } else if (viewType === "densidade-lilas") {
    // Densidade - Lilás (4 níveis de intensidade)
    const densityLevels = [];

    data.forEach((item) => {
      const lat =
        parseFloat(item.latitude) ||
        parseFloat(item.LAT) ||
        parseFloat(item.Latitude) ||
        -14.235;
      const lon =
        parseFloat(item.longitude) ||
        parseFloat(item.LON) ||
        parseFloat(item.Longitude) ||
        -51.9253;

      if (isNaN(lat) || isNaN(lon)) return;

      densityLevels.push({ lat, lon, bds: item.BDs || 0, item });
    });

    densityLevels.sort((a, b) => b.bds - a.bds);

    const q1 = Math.floor(densityLevels.length * 0.25);
    const q2 = Math.floor(densityLevels.length * 0.5);
    const q3 = Math.floor(densityLevels.length * 0.75);

    densityLevels.forEach((data, index) => {
      let color, fillOpacity, radius, densidadeLabel;

      if (index < q1) {
        color = "#8e44ad";
        fillOpacity = 0.9;
        radius = Math.min(data.bds * 1200, 60000);
        densidadeLabel = "Muito Alta";
      } else if (index < q2) {
        color = "#9b59b6";
        fillOpacity = 0.7;
        radius = Math.min(data.bds * 1000, 50000);
        densidadeLabel = "Alta";
      } else if (index < q3) {
        color = "#af7ac5";
        fillOpacity = 0.5;
        radius = Math.min(data.bds * 800, 40000);
        densidadeLabel = "Média";
      } else {
        color = "#c39bd3";
        fillOpacity = 0.3;
        radius = Math.min(data.bds * 600, 30000);
        densidadeLabel = "Baixa";
      }

      const circle = L.circle([data.lat, data.lon], {
        radius: radius,
        color: color,
        fillColor: color,
        fillOpacity: fillOpacity,
        weight: 0,
      }).addTo(map);

      const tooltipContent = `<div class="tooltip-info">
                <div><strong>Cidade:</strong> ${data.item.CIDADE_ATUALIAZADA || data.item.CIDADE || "Desconhecida"}</div>
                <div><strong>UF:</strong> ${data.item.UF || "Desconhecida"}</div>
                <div><strong>BDs:</strong> ${data.bds}</div>
                <div><strong>Plantas:</strong> ${data.item.PLANTA || 0}</div>
                <div><strong>Densidade:</strong> ${densidadeLabel}</div>
            </div>`;

      circle.bindTooltip(tooltipContent, {
        permanent: false,
        direction: "top",
      });
      markers.push(circle);
    });
  } else {
    // Modo marcadores normais
    data.forEach((item) => {
      const lat =
        parseFloat(item.latitude) ||
        parseFloat(item.LAT) ||
        parseFloat(item.Latitude) ||
        -14.235;
      const lon =
        parseFloat(item.longitude) ||
        parseFloat(item.LON) ||
        parseFloat(item.Longitude) ||
        -51.9253;

      if (isNaN(lat) || isNaN(lon)) return;

      let tooltipContent = '<div class="tooltip-info">';
      Object.keys(item).forEach((key) => {
        if (
          ![
            "latitude",
            "longitude",
            "LAT",
            "LON",
            "Latitude",
            "Longitude",
          ].includes(key)
        ) {
          tooltipContent += `<div><strong>${key}:</strong> ${item[key]}</div>`;
        }
      });
      tooltipContent += "</div>";

      const marker = L.marker([lat, lon]).addTo(map);
      marker.bindTooltip(tooltipContent, {
        permanent: false,
        direction: "top",
      });
      markers.push(marker);
    });
  }
}

// Limpar marcadores do mapa
function clearMarkers() {
  // Remover marcadores/círculos
  markers.forEach((marker) => {
    map.removeLayer(marker);
  });
  markers = [];
}

// Função para aplicar zoom automático para uma UF específica
function zoomToUf(uf, data) {
  // Filtrar coordenadas válidas para a UF
  const coords = data
    .map((item) => {
      const lat =
        parseFloat(item.latitude) ||
        parseFloat(item.LAT) ||
        parseFloat(item.Latitude);
      const lon =
        parseFloat(item.longitude) ||
        parseFloat(item.LON) ||
        parseFloat(item.Longitude);
      return { lat, lon };
    })
    .filter((coord) => !isNaN(coord.lat) && !isNaN(coord.lon));

  if (coords.length > 0) {
    // Criar bounds com as coordenadas
    const bounds = L.latLngBounds(
      coords.map((coord) => [coord.lat, coord.lon]),
    );

    // Aplicar o zoom para os limites da UF
    map.fitBounds(bounds, {
      padding: [50, 50],
      maxZoom: 8,
    });
  }
}

// Atualizar tabela resumo
function updateSummaryTable(data) {
  const tbody = document.querySelector("#summaryTable tbody");
  tbody.innerHTML = "";

  // Obter valor do filtro de UF para determinar o modo de exibição
  const ufValue = document.getElementById("ufFilter").value;

  if (ufValue) {
    // Modo detalhado: mostrar cidades, plantas e BDs para a UF selecionada
    const filteredData = data.filter((item) => item.UF === ufValue);

    // Classificar por volume de BDs (decrescente)
    filteredData.sort((a, b) => (b.BDs || 0) - (a.BDs || 0));

    // Adicionar classe CSS para tabela com 3 colunas
    const table = document.getElementById("summaryTable");
    table.className = "col3";

    // Adicionar linhas à tabela com detalhes
    filteredData.forEach((item) => {
      const row = document.createElement("tr");

      const cidadeCell = document.createElement("td");
      cidadeCell.textContent =
        item.CIDADE_ATUALIAZADA || item.CIDADE || "Desconhecido";

      const plantaCell = document.createElement("td");
      plantaCell.textContent = item.PLANTA || 0;

      const bdsCell = document.createElement("td");
      bdsCell.textContent = item.BDs || 0;

      row.appendChild(cidadeCell);
      row.appendChild(plantaCell);
      row.appendChild(bdsCell);

      tbody.appendChild(row);
    });

    // Atualizar cabeçalho da tabela
    const thead = document.querySelector("#summaryTable thead tr");
    thead.innerHTML = "";
    const headers = ["Cidade", "Planta", "BDs"];
    headers.forEach((headerText) => {
      const th = document.createElement("th");
      th.textContent = headerText;
      thead.appendChild(th);
    });
  } else {
    // Modo geral: agrupar por UF como antes
    const groupedByUf = data.reduce((acc, item) => {
      const uf = item.UF || "Desconhecido";
      if (!acc[uf]) {
        acc[uf] = { count: 0, totalPlantas: 0, totalBDs: 0 };
      }
      acc[uf].count++;
      acc[uf].totalPlantas += item.PLANTA || 0;
      acc[uf].totalBDs += item.BDs || 0;
      return acc;
    }, {});

    // Remover classe CSS específica para tabela com 3 colunas
    const table = document.getElementById("summaryTable");
    table.className = "";

    // Converter objeto em array e ordenar por UF
    const sortedUfs = Object.entries(groupedByUf).sort((a, b) =>
      a[0].localeCompare(b[0]),
    );

    // Adicionar linhas à tabela
    sortedUfs.forEach(([uf, data]) => {
      const row = document.createElement("tr");

      const ufCell = document.createElement("td");
      ufCell.textContent = uf;

      const countCell = document.createElement("td");
      countCell.textContent = data.count;

      row.appendChild(ufCell);
      row.appendChild(countCell);

      tbody.appendChild(row);
    });

    // Atualizar cabeçalho da tabela
    const thead = document.querySelector("#summaryTable thead tr");
    thead.innerHTML = "";
    const headers = ["UF", "Total Cidades"];
    headers.forEach((headerText) => {
      const th = document.createElement("th");
      th.textContent = headerText;
      thead.appendChild(th);
    });
  }
}

// Função para carregar dados automaticamente
function loadLastData() {
  fetch("/mapab2b/data")
    .then((response) => response.json())
    .then((data) => {
      if (data && data.length > 0) {
        rawData = data;
        processDataAndDisplay(rawData);
        console.log("Dados do último upload carregados automaticamente");
      } else {
        console.log("Nenhum dado disponível do último upload");
      }
    })
    .catch((error) => {
      console.error("Erro ao carregar dados do último upload:", error);
    });
}

// Inicializar o mapa quando a página carregar
document.addEventListener("DOMContentLoaded", function () {
  initMap();
  // Carregar dados do último upload automaticamente
  loadLastData();
});
