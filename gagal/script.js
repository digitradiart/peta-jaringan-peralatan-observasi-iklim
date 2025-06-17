// Inisialisasi peta
var map = L.map("map").setView([-2, 118], 5); // Fokus Indonesia

// Tambahkan tile layer
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 18,
  attribution: "© OpenStreetMap",
}).addTo(map);

// Fungsi untuk load GeoJSON dengan cluster
function addGeoJSONLayer(file, label, color) {
  fetch(file)
    .then((res) => res.json())
    .then((data) => {
      var markers = L.markerClusterGroup();

      var geoLayer = L.geoJSON(data, {
        pointToLayer: function (feature, latlng) {
          return L.circleMarker(latlng, {
            radius: 6,
            fillColor: color,
            color: "#000",
            weight: 1,
            fillOpacity: 0.8,
          });
        },
        onEachFeature: function (feature, layer) {
          const prop = feature.properties;
          const popupContent = `
        <strong>${label}</strong><br/>
        No Stasiun: ${prop["NO STASIUN"] || "-"}<br/>
        Provinsi: ${prop["PROVINSI"] || "-"}<br/>
        Kabupaten/Kota: ${prop["KAB/KOTA"] || prop["KAB_KOTA"] || "-"}
      `;
          layer.bindPopup(popupContent);
        },
      });

      markers.addLayer(geoLayer);
      layerControl.addOverlay(markers, label);
      map.addLayer(markers);
    });
}

// Layer control
var layerControl = L.control
  .layers(null, null, { collapsed: false })
  .addTo(map);

// Tambahkan semua file geojson di sini
addGeoJSONLayer("geojson/phobs.geojson", "PHOBS", "blue");
addGeoJSONLayer("geojson/arg.geojson", "ARG", "red");
addGeoJSONLayer("geojson/aws.geojson", "AWS", "green");
addGeoJSONLayer("geojson/aaws.geojson", "AAWS", "yellow");
addGeoJSONLayer("geojson/asrs.geojson", "ASRS", "gray");
addGeoJSONLayer("geojson/iklimmikro.geojson", "IKLIM MIKRO", "purple");
addGeoJSONLayer("geojson/soil.geojson", "SOIL", "orange");
