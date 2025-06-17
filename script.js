// Layer Map Indonesia
const map = L.map("map").setView([-2.5, 117], 5); // Indonesia center, zoom level 5
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap",
}).addTo(map);

// Baca Data JSON Layer
const colors = {
  phobs: "red",
  arg: "blue",
  aws: "green",
  aaws: "purple",
  asrs: "orange",
  iklimmikro: "yellow",
  soil: "brown",
};

const geojsonTypes = Object.keys(colors);
const markers = [];
const provinsiSet = new Set();

geojsonTypes.forEach((type) => {
  fetch(`geojson/${type}.geojson`)
    .then((res) => res.json())
    .then((data) => {
      data.features.forEach((f) => {
        const coords = f.geometry.coordinates;
        const lat = coords[1];
        const lon = coords[0];
        const props = f.properties;

        const provinsi = props["PROVINSI"];
        if (provinsi && !provinsiSet.has(provinsi)) {
          provinsiSet.add(provinsi);
          const opt = document.createElement("option");
          opt.value = provinsi;
          opt.text = provinsi;
          document.getElementById("provinsiFilter").appendChild(opt);
        }

        const marker = L.circleMarker([lat, lon], {
          radius: 4,
          color: colors[type],
          fillOpacity: 0.5,
        }).bindPopup(`
    <b>Jenis:</b> ${type}<br>
    <b>No Stasiun:</b> ${props["NO STASIUN"]}<br>
    <b>Kab/Kota:</b> ${props["KAB/KOTA"]}<br>
    <b>Provinsi:</b> ${provinsi}
  `);

        marker._provinsi = provinsi;
        marker._jenis = type;
        marker.addTo(map);
        markers.push(marker);
      });
    });
});

// Apply Filters
function applyFilters() {
  const selectedProv = document.getElementById("provinsiFilter").value;
  const selectedJenis = document.getElementById("jenisFilter").value;

  markers.forEach((m) => {
    const matchProv = !selectedProv || m._provinsi === selectedProv;
    const matchJenis = !selectedJenis || m._jenis === selectedJenis;

    if (matchProv && matchJenis) {
      m.setStyle({ opacity: 1, fillOpacity: 0.8 });
      m.addTo(map);
    } else {
      m.removeFrom(map);
    }
  });

  updateSummaryTable();
}

// Update Summary Table
function updateSummaryTable() {
  const counts = {};

  markers.forEach((m) => {
    if (!map.hasLayer(m)) return;

    const prov = m._provinsi || "Lainnya";
    const jenis = m._jenis || "Lainnya";

    if (!counts[prov]) counts[prov] = {};
    if (!counts[prov][jenis]) counts[prov][jenis] = 0;
    counts[prov][jenis]++;
  });

  let html =
    '<h3>Ringkasan Data Terfilter</h3><table border="1" cellpadding="5" cellspacing="0"><tr><th>Provinsi</th>';
  geojsonTypes.forEach((j) => (html += `<th>${j}</th>`));
  html += "<th>Total</th></tr>";

  for (const prov in counts) {
    let total = 0;
    html += `<tr><td>${prov}</td>`;
    geojsonTypes.forEach((j) => {
      const val = counts[prov][j] || 0;
      html += `<td>${val}</td>`;
      total += val;
    });
    html += `<td>${total}</td></tr>`;
  }

  html += "</table>";
  document.getElementById("summary").innerHTML = html;
}
