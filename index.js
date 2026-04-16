// 1. Configuración Inicial del Mapa
// Nota: Usamos una capa de CartoDB que es más estable para evitar bloqueos de Referer
var map = L.map("map").setView([23.6345, -102.5528], 5);

L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
    attribution: "&copy; OpenStreetMap &copy; CartoDB"
}).addTo(map);

// Variables Globales
let baseDeDatosProyectos = null;
let capaKMLUsuario = L.featureGroup().addTo(map);

// CAMBIO CLAVE: En lugar de la URL de GeoServer local, usamos tu archivo en GitHub
const geojsonLocalUrl = "./poligonosproyectos.geojson";

// 2. Cargar Capa Base (Sustituye a GeoServer)
fetch(geojsonLocalUrl)
    .then(response => {
        if (!response.ok) throw new Error("No se pudo cargar el archivo GeoJSON desde el repositorio");
        return response.json();
    })
    .then(data => {
        baseDeDatosProyectos = data;
        console.log("✅ Base de datos cargada desde archivo local exitosamente.");

        L.geoJSON(data, {
            style: {
                color: "#7f8c8d",
                weight: 1.5,
                fillColor: "#bdc3c7",
                fillOpacity: 0.3
            },
            onEachFeature: function (feature, layer) {
                let nombre = feature.properties.nombre || feature.properties.Name || "Proyecto sin nombre";
                layer.bindPopup("<b>Proyecto Existente:</b><br>" + nombre);
            }
        }).addTo(map);
    })
    .catch(err => {
        console.error("❌ Error al cargar datos:", err);
        alert("Atención: No se pudo cargar la base de proyectos. Asegúrate de que el archivo .geojson esté en el repositorio.");
    });

// 3. Procesar Carga de KML (Mantenemos tu lógica original)
document.getElementById('upload-kml').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const parser = new DOMParser();
            const kmlDoc = parser.parseFromString(event.target.result, "text/xml");
            
            // Asegúrate de que la librería toGeoJSON esté cargada en tu HTML
            const geojsonSubido = toGeoJSON.kml(kmlDoc);
            
            capaKMLUsuario.clearLayers(); // Limpiar carga anterior si existe
            
            const layerNueva = L.geoJSON(geojsonSubido, { 
                style: { color: "#2980b9", weight: 3, fillOpacity: 0.5 } 
            }).addTo(capaKMLUsuario);
            
            map.fitBounds(capaKMLUsuario.getBounds());

            ejecutarAnalisis(geojsonSubido);
        } catch (error) {
            console.error("Error al procesar KML:", error);
            alert("El archivo KML no parece válido o falta la librería toGeoJSON.");
        }
    };
    reader.readAsText(file);
});

// 4. Función de Análisis Espacial (Intersección con Turf.js)
function ejecutarAnalisis(capaUsuario) {
    if (!baseDeDatosProyectos) {
        alert("Base de datos no disponible para comparación.");
        return;
    }

    let encontrados = [];

    capaUsuario.features.forEach(fUser => {
        baseDeDatosProyectos.features.forEach(fDB => {
            // Turf.js hace la magia aquí
            const interseccion = turf.intersect(fUser, fDB);
            if (interseccion) {
                let nombre = fDB.properties.nombre || fDB.properties.Name || "Sin Nombre";
                encontrados.push(nombre);
            }
        });
    });

    if (encontrados.length > 0) {
        const listaUnica = [...new Set(encontrados)];
        alert("⚠️ ATENCIÓN: Se detectaron traslapes con:\n\n- " + listaUnica.join("\n- "));
    } else {
        alert("✅ El área analizada se encuentra libre de traslapes.");
    }
}

// 5. Función del Botón Limpiar
document.getElementById('btn-limpiar').addEventListener('click', function() {
    capaKMLUsuario.clearLayers();
    document.getElementById('upload-kml').value = "";
    map.setView([23.6345, -102.5528], 5);
    console.log("🧹 Mapa de análisis limpiado.");
});
