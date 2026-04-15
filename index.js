// 1. Configuración Inicial del Mapa
var map = L.map("map").setView([23.6345, -102.5528], 5);

L.tileLayer("https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap"
}).addTo(map);

// Variables Globales
let baseDeDatosProyectos = null;
let capaKMLUsuario = L.featureGroup().addTo(map); // Aquí se guardan los KML que subas

// URL de GeoServer
const geoserverUrl = "http://localhost:8080/geoserver/intercesion/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=intercesion%3Apoligonosproyectos___poligonos_proyectos&outputFormat=application%2Fjson";

// 2. Cargar Capa Base de GeoServer (Polígonos en Gris)
fetch(geoserverUrl)
    .then(response => {
        if (!response.ok) throw new Error("No se pudo conectar con GeoServer");
        return response.json();
    })
    .then(data => {
        baseDeDatosProyectos = data;
        console.log("✅ Base de datos cargada exitosamente.");

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
        console.error("❌ Error de GeoServer:", err);
        alert("Atención: No se pudo conectar con GeoServer. Verifica que el servicio esté activo.");
    });

// 3. Procesar Carga de KML
document.getElementById('upload-kml').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const parser = new DOMParser();
            const kmlDoc = parser.parseFromString(event.target.result, "text/xml");
            const geojsonSubido = toGeoJSON.kml(kmlDoc);
            
            // Dibujar el KML subido en Azul dentro del FeatureGroup
            const layerNueva = L.geoJSON(geojsonSubido, { 
                style: { color: "#2980b9", weight: 3, fillOpacity: 0.5 } 
            }).addTo(capaKMLUsuario);
            
            // Ajustar vista al nuevo polígono
            map.fitBounds(capaKMLUsuario.getBounds());

            // Realizar análisis de intersección
            ejecutarAnalisis(geojsonSubido);
        } catch (error) {
            console.error("Error al procesar KML:", error);
            alert("El archivo KML no parece válido.");
        }
    };
    reader.readAsText(file);
});

// 4. Función de Análisis Espacial (Intersección)
function ejecutarAnalisis(capaUsuario) {
    if (!baseDeDatosProyectos) {
        alert("Base de datos no disponible para comparación.");
        return;
    }

    let encontrados = [];

    // Comparamos cada polígono subido contra cada polígono de la DB
    capaUsuario.features.forEach(fUser => {
        baseDeDatosProyectos.features.forEach(fDB => {
            const interseccion = turf.intersect(fUser, fDB);
            if (interseccion) {
                let nombre = fDB.properties.nombre || fDB.properties.Name || "Sin Nombre";
                encontrados.push(nombre);
            }
        });
    });

    // Mostrar resultados
    if (encontrados.length > 0) {
        const listaUnica = [...new Set(encontrados)];
        alert("⚠️ ATENCIÓN: Se detectaron traslapes con:\n\n- " + listaUnica.join("\n- "));
    } else {
        alert("✅ El área analizada se encuentra libre de traslapes.");
    }
}

// 5. Función del Botón Limpiar
document.getElementById('btn-limpiar').addEventListener('click', function() {
    // Borrar solo los polígonos azules del usuario
    capaKMLUsuario.clearLayers();
    
    // Limpiar el selector de archivos
    document.getElementById('upload-kml').value = "";
    
    // Regresar vista inicial
    map.setView([23.6345, -102.5528], 5);
    
    console.log("🧹 Mapa de análisis limpiado.");
});