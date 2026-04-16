document.addEventListener("DOMContentLoaded", function() {
    
    // 1. Configuración Inicial del Mapa
    var map = L.map("map").setView([23.6345, -102.5528], 5);

    // Capa base de Carto (evita bloqueos de referer)
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: "&copy; OpenStreetMap &copy; CartoDB"
    }).addTo(map);

    // Variables Globales
    let baseDeDatosProyectos = null;
    let capaKMLUsuario = L.featureGroup().addTo(map);

    // URL del archivo local en GitHub
    const geojsonLocalUrl = "./poligonosproyectos.geojson";

    // 2. Cargar Capa Base (GeoJSON local)
    fetch(geojsonLocalUrl)
        .then(response => {
            if (!response.ok) throw new Error("No se pudo cargar el GeoJSON");
            return response.json();
        })
        .then(data => {
            baseDeDatosProyectos = data;
            console.log("✅ Base de datos cargada correctamente.");

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
        });

    // 3. Procesar Carga de KML
    const fileInput = document.getElementById('upload-kml');
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(event) {
                try {
                    const parser = new DOMParser();
                    const kmlDoc = parser.parseFromString(event.target.result, "text/xml");
                    const geojsonSubido = toGeoJSON.kml(kmlDoc);
                    
                    capaKMLUsuario.clearLayers();
                    
                    L.geoJSON(geojsonSubido, { 
                        style: { color: "#2980b9", weight: 3, fillOpacity: 0.5 } 
                    }).addTo(capaKMLUsuario);
                    
                    map.fitBounds(capaKMLUsuario.getBounds());

                    ejecutarAnalisis(geojsonSubido);
                } catch (error) {
                    console.error("Error al procesar KML:", error);
                    alert("El archivo KML no es válido.");
                }
            };
            reader.readAsText(file);
        });
    }

    // 4. Función de Análisis Espacial
    function ejecutarAnalisis(capaUsuario) {
        if (!baseDeDatosProyectos) {
            alert("Base de datos no disponible.");
            return;
        }

        let encontrados = [];

        capaUsuario.features.forEach(fUser => {
            baseDeDatosProyectos.features.forEach(fDB => {
                const interseccion = turf.intersect(fUser, fDB);
                if (interseccion) {
                    let nombre = fDB.properties.nombre || fDB.properties.Name || "Sin Nombre";
                    encontrados.push(nombre);
                }
            });
        });

        if (encontrados.length > 0) {
            const listaUnica = [...new Set(encontrados)];
            alert("⚠️ TRASLAPE DETECTADO con:\n\n- " + listaUnica.join("\n- "));
        } else {
            alert("✅ Área libre de traslapes.");
        }
    }

    // 5. Botón Limpiar
    const btnLimpiar = document.getElementById('btn-limpiar');
    if (btnLimpiar) {
        btnLimpiar.addEventListener('click', function() {
            capaKMLUsuario.clearLayers();
            document.getElementById('upload-kml').value = "";
            map.setView([23.6345, -102.5528], 5);
        });
    }
});
