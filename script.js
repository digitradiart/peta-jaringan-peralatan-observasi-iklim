// LAYER PETA INDONESIA
const map = L.map("map").setView([-2.5, 117], 5);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    "<a href='https://www.openstreetmap.org/#map=5/-2.55/118.02' target='_blank'>© OpenStreetMap</a>",
}).addTo(map);

// JENIS GEOJSON, ADA 7 JENIS JARINGAN
const geojsonTypes = [
  "PHOBS",
  "ARG",
  "AWS",
  "AAWS",
  "ASRS",
  "IKLIMMIKRO",
  "SOIL",
];
const markers = [];
const provinsiSet = new Set();
const provinsiColors = {};
let provinsiIndex = 0;

// WARNA UNTUK PROVINSI
const colorPalette = [
  "#e6194b",
  "#3cb44b",
  "#ffe119",
  "#4363d8",
  "#f58231",
  "#911eb4",
  "#46f0f0",
  "#f032e6",
  "#bcf60c",
  "#fabebe",
  "#008080",
  "#e6beff",
  "#9a6324",
  "#ac8",
  "#800000",
  "#aaffc3",
  "#808000",
  "#ffd8b1",
  "#000075",
  "#808080",
  "#ff5400",
  "#000000",
  "#a83279",
  "#9c27b0",
  "#4caf50",
  "#03a9f4",
  "#e91e63",
  "#ff9800",
  "#cddc39",
  "#673ab7",
  "#2196f3",
  "#00bcd4",
  "#8bc34a",
  "#ffc107",
  "#ff5722",
  "#607d8b",
  "#795548",
  "#009688",
];

// FUNGSI UNTUK MENDAPATKAN WARNA PROVINSI
function getNewColor(provinsi) {
  const color = colorPalette[provinsiIndex % colorPalette.length];
  provinsiColors[provinsi] = color;
  provinsiIndex++;
  return color;
}

// VARIABLES UNTUK SIMBOL
const symbolMap = {
  PHOBS: "●",
  ARG: "▲",
  AWS: "■",
  AAWS: "★",
  ASRS: "❇",
  IKLIMMIKRO: "◆",
  SOIL: "♣",
};

// FUNGSI UNTUK MAPPING GEOJSON KE MARKER
geojsonTypes.forEach((type) => {
  fetch(`geojson/${type.toLowerCase()}.geojson`)
    .then((res) => res.json())
    .then((data) => {
      data.features.forEach((f) => {
        const coords = f.geometry.coordinates;
        const [lon, lat] = coords;
        const props = f.properties;
        const provinsi = props["PROVINSI"] || "TIDAK DIKETAHUI";

        if (!provinsiSet.has(provinsi)) {
          provinsiSet.add(provinsi);
          const opt = document.createElement("option");
          opt.value = provinsi;
          opt.text = provinsi;
          document.getElementById("provinsiFilter").appendChild(opt);
        }

        const color = provinsiColors[provinsi] || getNewColor(provinsi);
        const icon = L.divIcon({
          html: `<div style="color:${color}; font-size:14px; line-height:14px;">${
            symbolMap[type] || "●"
          }</div>`,
          className: "",
          iconSize: [14, 14],
        });

        // POPUP MARKER
        const marker = L.marker([lat, lon], { icon }).bindPopup(`
          <b>Provinsi:</b> ${provinsi}<br>
          <b>Kab/Kota:</b> ${props["KAB/KOTA"]}<br>
          <b>Kecamatan:</b> ${props["KECAMATAN"]}<br>
          <b>Desa:</b> ${props["DESA"]}<br>
          <b>No Stasiun:</b> ${props["NO STASIUN"]}<br>
          <b>Jaringan Pengamatan:</b> ${type}
        `);

        marker._provinsi = provinsi;
        marker._jenis = type;
        marker.addTo(map);
        markers.push(marker);
      });

      updateSummaryTable();
      updateLegend();
    });
});

// EVENT LISTENER UNTUK FILTER
function applyFilters() {
  const selectedProv = document.getElementById("provinsiFilter").value;
  const selectedJenis = document.getElementById("jenisFilter").value;

  markers.forEach((m) => {
    const matchProv = !selectedProv || m._provinsi === selectedProv;
    const matchJenis = !selectedJenis || m._jenis === selectedJenis;
    if (matchProv && matchJenis) m.addTo(map);
    else m.removeFrom(map);
  });
  updateSummaryTable();
  updateTitle();
}

// FUNGSI UNTUK UPDATE FILTER
function updateTitle() {
  const jenis = document.getElementById("jenisFilter").value;
  const prov = document.getElementById("provinsiFilter").value;
  let title = "Peta Jaringan Peralatan Observasi";
  if (jenis && prov) title += ` ${jenis} di ${prov}`;
  else if (jenis) title += ` ${jenis} di Indonesia`;
  else if (prov) title += ` di ${prov}`;
  else title += ` di Indonesia`;
  document.getElementById("judulPeta").innerText = title;
}

// FUNGSI UNTUK UPDATE TABEL RINGKASAN
function updateSummaryTable() {
  const counts = {};
  const grandTotal = {};
  let totalKeseluruhan = 0;

  markers.forEach((m) => {
    if (!map.hasLayer(m)) return;
    const prov = m._provinsi;
    const jenis = m._jenis;

    if (!counts[prov]) counts[prov] = {};
    if (!counts[prov][jenis]) counts[prov][jenis] = 0;
    counts[prov][jenis]++;

    // Hitung grand total
    if (!grandTotal[jenis]) grandTotal[jenis] = 0;
    grandTotal[jenis]++;
    totalKeseluruhan++;
  });

  let html =
    "<h3 class='text-center'>Ringkasan Data Terfilter</h3><table class='table table-striped table-hover'><tr><th>Nomor</th><th>Provinsi</th>";
  geojsonTypes.forEach((j) => (html += `<th>${j}</th>`));
  html += "<th>Jumlah</th></tr>";

  // Isi baris untuk setiap provinsi
  for (const prov in counts) {
    let total = 0;
    let nomor = Object.keys(counts).indexOf(prov) + 1;
    html += `<tr><td>${nomor}</td><td>${prov}</td>`;
    geojsonTypes.forEach((j) => {
      const val = counts[prov][j] || 0;
      html += `<td>${val}</td>`;
      total += val;
    });
    html += `<td>${total}</td></tr>`;
  }

  // Tambahkan baris Grand Total
  html += `<tr style="font-weight:bold; background:#eee;"><td colspan="2">Total Indonesia</td>`;
  geojsonTypes.forEach((j) => {
    const val = grandTotal[j] || 0;
    html += `<td>${val}</td>`;
  });
  html += `<td>${totalKeseluruhan}</td></tr>`;

  html += "</table>";
  document.getElementById("summary").innerHTML = html;
}

// FUNGSI UNTUK UPDATE LEGENDA
function updateLegend() {
  let html = "<b>Simbol per Jenis Data:</b><br>";
  for (const type in symbolMap) {
    html += `<li>${symbolMap[type]} : ${type}</li>`;
  }
  html += "<br><b>Simbol Warna per Provinsi:</b><br>";
  for (const prov in provinsiColors) {
    html += `<li><div class="provcolor" style="display:inline-block; width:12px; height:12px; background:${provinsiColors[prov]}; margin-right:4px; display:flex; flex-direction: row;"></div>: ${prov}</li>`;
  }
  document.getElementById("legend").innerHTML = html;
}
