// Configuración inicial del mapa
const map = L.map('map').setView([19.4326, -99.1332], 10);

// Capa base de Carto (Evita el bloqueo de Referer de OSM)
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap'
}).addTo(map);

let proyectosLayer;

// CARGA DE DATOS DESDE GITHUB
// En lugar de localhost:8080, usamos la ruta relativa
fetch('./poligonosproyectos.geojson')
    .then(response => {
        if (!response.ok) throw new Error("No se pudo cargar el archivo GeoJSON");
        return response.json();
    })
    .then(data => {
        console.log("Datos cargados correctamente:", data);
        
        // Añadir los proyectos al mapa
        proyectosLayer = L.geoJSON(data, {
            style: { color: "#3388ff", weight: 2, fillOpacity: 0.2 }
        }).addTo(map);

        // Ajustar el mapa a los polígonos
        map.fitBounds(proyectosLayer.getBounds());
    })
    .catch(error => console.error("Error al cargar datos:", error));

// Ejemplo de lógica de Intersección con Turf.js
document.getElementById('btnIntersect').addEventListener('click', () => {
    // Aquí iría tu lógica de intersección usando la variable 'data'
    // que cargamos en el fetch.
    alert("Función de intersección lista para procesar poligonosproyectos.geojson");
});
