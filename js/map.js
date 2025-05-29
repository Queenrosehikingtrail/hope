// js/map.js

let map;
let userLocationMarker;
let trailLayers = {}; // Store loaded KML/GPX layers { trailId: layer }
let trailLoadPromises = {}; // Store promises for loading trails { trailId: promise }
let currentTrailLayer = null; // Store the single layer currently displayed (not used for 'all')

// Load KML/GPX data for a trail, return promise resolving with the layer
function loadTrail(trailId) {
    console.log(`[Map - loadTrail] Attempting to load trail: ${trailId}`); // Log start
    if (trailId === 'none') {
        console.log("[Map - loadTrail] Trail ID is 'none', resolving null.");
        return Promise.resolve(null); // Resolve immediately for 'none'
    }
    if (trailLayers[trailId]) {
        console.log(`[Map - loadTrail] Trail ${trailId} already in cache (trailLayers). Returning cached layer.`);
        return Promise.resolve(trailLayers[trailId]); // Already loaded
    }
    if (trailLoadPromises[trailId]) {
        console.log(`[Map - loadTrail] Trail ${trailId} is already being loaded (trailLoadPromises). Returning existing promise.`);
        return trailLoadPromises[trailId]; // Already loading
    }

    const trail = getTrailById(trailId);
    if (!trail) {
        console.error(`[Map - loadTrail] Trail data not found for ID: ${trailId}`);
        return Promise.reject(`Trail data not found for ID: ${trailId}`);
    }

    const kmlPath = `/kml/${trail.kmlFilename}`; // Use absolute path from root and kmlFilename property
    console.log(`[Map - loadTrail] KML path set to: ${kmlPath}`);

    console.log(`[Map - loadTrail] Starting fetch for ${kmlPath}...`);
    trailLoadPromises[trailId] = fetch(kmlPath)
        .then(response => {
            console.log(`[Map - loadTrail] Fetch response received for ${kmlPath}. Status: ${response.status}, OK: ${response.ok}`);
            if (!response.ok) {
                console.error(`[Map - loadTrail] Fetch failed for ${kmlPath}. Status: ${response.status}`);
                throw new Error(`HTTP error! status: ${response.status} for ${kmlPath}`);
            }
            console.log(`[Map - loadTrail] Fetch successful for ${kmlPath}. Reading response text...`);
            return response.text();
        })
        .then(kmlText => {
            console.log(`[Map - loadTrail] Received KML text for ${trailId}. Length: ${kmlText.length}`);
            // console.log(`[Map - loadTrail] KML Text (first 500 chars): ${kmlText.substring(0, 500)}`); // Optional: Log snippet of KML
            console.log(`[Map - loadTrail] Parsing KML text for ${trailId} using DOMParser...`);
            const kmlDoc = new DOMParser().parseFromString(kmlText, 'text/xml');

            // Check for parser errors
            const parserError = kmlDoc.querySelector('parsererror');
            if (parserError) {
                console.error(`[Map - loadTrail] KML Parse Error for ${trailId}:`, parserError.textContent);
                throw new Error(`Invalid KML format for ${trailId}`);
            }
            console.log(`[Map - loadTrail] KML parsed successfully for ${trailId}. Converting to GeoJSON...`);
            const geojson = toGeoJSON.kml(kmlDoc);

            if (!geojson || !geojson.features || geojson.features.length === 0) {
                 console.error(`[Map - loadTrail] No GeoJSON features found after conversion for ${trailId}.`);
                 throw new Error(`No features found in KML for ${trailId}`);
            }
            console.log(`[Map - loadTrail] GeoJSON conversion successful for ${trailId}. Found ${geojson.features.length} features. Creating Leaflet layer...`);
            const layer = L.geoJSON(geojson, {
                style: function (feature) {
                    // Only style lines
                    if (feature.geometry.type === 'LineString' || feature.geometry.type === 'MultiLineString') {
                        return { color: 'red', weight: 3, opacity: 0.8 };
                    }
                },
                filter: function(feature, layer) {
                    // Only show lines, hide points
                    return feature.geometry.type === 'LineString' || feature.geometry.type === 'MultiLineString';
                }
            });
            trailLayers[trailId] = layer; // Store the layer
            console.log(`[Map - loadTrail] Successfully created and cached Leaflet layer for ${trailId}.`);
            delete trailLoadPromises[trailId]; // Remove promise once loaded
            return layer; // Resolve promise with the layer
        })
        .catch(e => {
            console.error(`[Map - loadTrail] Error during fetch/parse/conversion for trail ${trailId}:`, e);
            delete trailLoadPromises[trailId]; // Remove promise on error
            // Don't throw here, let displayTrail handle the lack of layer
            return null; // Resolve with null on error
        });

    return trailLoadPromises[trailId];
}

// Display selected trail (async function to handle loading)
async function displayTrail(trailId) {
    console.log(`[Map - displayTrail] Displaying trail: ${trailId}`);
    
    // Update the trail selector dropdown to match the selected trail
    const trailSelect = document.getElementById('trail-select');
    if (trailSelect && trailSelect.value !== trailId) {
        console.log(`[Map - displayTrail] Updating trail selector dropdown to ${trailId}`);
        trailSelect.value = trailId;
    }
    
    // Clear any custom KML layers that might be displayed
    if (typeof clearCustomKmlLayers === 'function') {
        console.log("[Map - displayTrail] Clearing any custom KML layers");
        clearCustomKmlLayers(false); // Pass false to prevent recursive loop
    }
    
    // Remove current single layer if it exists
    if (currentTrailLayer) {
        if (map.hasLayer(currentTrailLayer)) {
             console.log("[Map - displayTrail] Removing previous currentTrailLayer.");
             map.removeLayer(currentTrailLayer);
        }
        currentTrailLayer = null;
    }
    
    // Remove all layers if switching to a single trail or 'none'
    // This might be redundant if currentTrailLayer logic is correct, but safe
    let removedCount = 0;
    Object.keys(trailLayers).forEach(key => {
        const layer = trailLayers[key];
        if (map.hasLayer(layer)) {
            map.removeLayer(layer);
            removedCount++;
        }
    });
    if(removedCount > 0) console.log(`[Map - displayTrail] Removed ${removedCount} existing trail layers.`);

    // If 'none' is selected, don't display any trails
    if (trailId === 'none') {
        console.log("[Map - displayTrail] 'none' selected, no trails will be displayed.");
        // Ensure all layers are cleared
        if (window.currentlyDisplayedKMLLayer) {
            console.log("[Map - displayTrail] Removing custom KML layer");
            map.removeLayer(window.currentlyDisplayedKMLLayer);
            window.currentlyDisplayedKMLLayer = null;
        }
        return;
    }
    else {
        // Load and display a single trail
        try {
            console.log(`[Map - displayTrail] Awaiting load for single trail: ${trailId}`);
            const layer = await loadTrail(trailId);
            if (layer) { // Check if layer loaded successfully
                 if (!map.hasLayer(layer)) {
                    console.log(`[Map - displayTrail] Adding layer for ${trailId} to map.`);
                    layer.addTo(map);
                 }
                currentTrailLayer = layer; // Set as the current single layer
                console.log(`[Map - displayTrail] Set currentTrailLayer for ${trailId}.`);
                // Zoom to the selected trail
                try {
                    if (layer.getBounds && layer.getBounds().isValid()) {
                        console.log(`[Map - displayTrail] Fitting bounds for ${trailId}`);
                        map.fitBounds(layer.getBounds());
                        setTimeout(() => { if (map) map.invalidateSize(); }, 100); // Ensure map re-renders tiles
                    } else {
                         console.warn(`[Map - displayTrail] Could not get valid bounds for trail ${trailId}`);
                         // Maybe set a default view if bounds fail?
                         // map.setView([-25.8, 30.8], 13);
                    }
                } catch (e) {
                    console.error(`[Map - displayTrail] Error getting bounds for trail ${trailId}:`, e);
                }
            } else {
                 // Error already logged in loadTrail, show alert
                 console.error(`[Map - displayTrail] Layer for trail ${trailId} could not be loaded or is invalid (resolved as null).`);
                 alert(`Failed to load map data for ${getTrailById(trailId)?.name || trailId}. Please check the KML file or network connection.`);
            }
        } catch (error) {
            // This catch might not be strictly necessary if loadTrail resolves null
            console.error(`[Map - displayTrail] Unexpected error displaying trail ${trailId}:`, error);
            alert(`An unexpected error occurred while trying to display ${getTrailById(trailId)?.name || trailId}.`);
        }
    }
}

// Track user location
function trackUserLocation() {
    console.log("[Map - trackUserLocation] Attempting to track location...");
    if (!navigator.geolocation) {
        console.error("[Map - trackUserLocation] Geolocation not supported.");
        alert('Geolocation is not supported by your browser.');
        return;
    }

    const options = {
        enableHighAccuracy: true,
        timeout: 10000, // 10 seconds
        maximumAge: 0 // Force fresh location
    };

    const trackBtn = document.getElementById('track-location-btn');
    trackBtn.textContent = 'Tracking...';
    trackBtn.disabled = true;
    console.log("[Map - trackUserLocation] Calling getCurrentPosition...");

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            const accuracy = position.coords.accuracy;
            console.log(`[Map - trackUserLocation] Location success: Lat ${lat}, Lon ${lon}, Accuracy ${accuracy}m`);

            const userLatLng = L.latLng(lat, lon);


            const heading = position.coords.heading;
            const speed = position.coords.speed;
            console.log(`[Map - trackUserLocation] Additional info: Hdg: ${heading}, Spd: ${speed} m/s`);

            let currentRotation = 0; // Default to North

            // Check if the existing marker is our arrow marker and has a stored rotation
            if (userLocationMarker && userLocationMarker instanceof L.Marker && userLocationMarker.options.icon && userLocationMarker.options.icon instanceof L.DivIcon && userLocationMarker.options.icon.options.html.includes("svg")) {
                // Attempt to retrieve stored rotation from the icon's custom property or parse from SVG
                if (typeof userLocationMarker.options.icon.options.rotation === 'number') {
                    currentRotation = userLocationMarker.options.icon.options.rotation;
                } else {
                    // Fallback: try to parse from SVG - this is more complex and less reliable, so storing is better
                    const existingSvgElement = userLocationMarker.getElement().querySelector('svg');
                    if (existingSvgElement && existingSvgElement.style.transform) {
                        const match = existingSvgElement.style.transform.match(/rotate\((\d+\.?\d*)deg\)/);
                        if (match && match[1]) currentRotation = parseFloat(match[1]);
                    }
                }
                 console.log(`[Map - trackUserLocation] Retrieved previous rotation: ${currentRotation}deg`);
            }

            // Update rotation if new heading is valid and user is moving
            if (heading !== null && typeof heading === 'number' && !isNaN(heading) && speed > 0.1) {
                currentRotation = heading;
                console.log(`[Map - trackUserLocation] Valid new heading. Setting rotation to: ${currentRotation}deg`);
            } else {
                console.log(`[Map - trackUserLocation] No valid new heading/speed. Maintaining current/previous rotation: ${currentRotation}deg`);
            }

            // Marker handling: Recreate if it's the old circle type or not our expected arrow marker
            let recreateMarker = false;
            if (userLocationMarker) {
                if (userLocationMarker instanceof L.CircleMarker) {
                    recreateMarker = true;
                    console.log("[Map - trackUserLocation] Detected old CircleMarker. Recreating as arrow marker.");
                } else if (userLocationMarker instanceof L.Marker) {
                    if (!userLocationMarker.options.icon || !(userLocationMarker.options.icon instanceof L.DivIcon) || !userLocationMarker.getElement() || !userLocationMarker.getElement().querySelector('svg')) {
                        recreateMarker = true;
                        console.log("[Map - trackUserLocation] Detected L.Marker but not the expected arrow DivIcon. Recreating.");
                    }
                } else {
                    recreateMarker = true; // Unknown type
                    console.log("[Map - trackUserLocation] Detected unknown marker type. Recreating as arrow marker.");
                }
                if (recreateMarker) {
                    map.removeLayer(userLocationMarker);
                    userLocationMarker = null;
                }
            }

            if (userLocationMarker) {
                // Existing arrow marker: update position and rotation
                console.log("[Map - trackUserLocation] Updating existing arrow marker position and rotation.");
                userLocationMarker.setLatLng(userLatLng);
                userLocationMarker.options.icon.options.rotation = currentRotation; // Store for persistence
                const iconElement = userLocationMarker.getElement();
                if (iconElement) {
                    const svgElement = iconElement.querySelector('svg');
                    if (svgElement) {
                        svgElement.style.transform = `rotate(${currentRotation}deg)`;
                        console.log(`[Map - trackUserLocation] Updated marker SVG rotation to ${currentRotation}deg.`);
                    }
                }
            } else {
                // Create new arrow marker
                console.log("[Map - trackUserLocation] Creating new location marker with direction arrow.");
                const arrowSvgHTML = `<svg viewBox="0 0 24 24" style="transform-origin: center; transform: rotate(${currentRotation}deg);" fill="yellow" width="24px" height="24px"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg>`;
                const directionIcon = L.divIcon({
                    html: arrowSvgHTML,
                    className: 'user-location-arrow-icon',
                    iconSize: [24, 24],
                    iconAnchor: [12, 12],
                    rotation: currentRotation // Custom property to store rotation state
                });
                userLocationMarker = L.marker(userLatLng, { icon: directionIcon }).addTo(map);
                console.log(`[Map - trackUserLocation] Created new arrow marker with initial rotation ${currentRotation}deg.`);
            }

            // Add accuracy circle (optional)
            // if (accuracyCircle) { map.removeLayer(accuracyCircle); }
            // accuracyCircle = L.circle(userLatLng, { radius: accuracy }).addTo(map);

            console.log("[Map - trackUserLocation] Setting map view to user location.");
            map.setView(userLatLng, 16); // Zoom to user location
            trackBtn.textContent = 'Track My Location';
            trackBtn.disabled = false;
            // Consider removing alert for better UX, rely on visual marker
            // alert('Location found! Blue dot shows your position.');
        },
        (error) => {
            trackBtn.textContent = 'Track My Location';
            trackBtn.disabled = false;
            let errorMsg = 'Error getting location: ';
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMsg += 'User denied the request for Geolocation.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMsg += 'Location information is unavailable. Check GPS signal.';
                    break;
                case error.TIMEOUT:
                    errorMsg += 'The request to get user location timed out.';
                    break;
                case error.UNKNOWN_ERROR:
                    errorMsg += 'An unknown error occurred.';
                    break;
            }
            console.error("[Map - trackUserLocation] Geolocation error:", errorMsg, error);
            alert(errorMsg + '\nPlease ensure location services are enabled and permissions are granted for this site.');
        },
        options
    );
}

// Initialize the map
function initMap() {
    console.log("[Map - initMap] Initializing map...");
    if (map) {
        console.warn("[Map - initMap] Map already initialized. Skipping.");
        return;
    }
    try {
        map = L.map('map').setView([-25.8, 30.8], 11); // Centered roughly on Nelshoogte
        console.log("[Map - initMap] Leaflet map object created.");

        // Use L.tileLayer.offline for caching capabilities
        const baseLayer = L.tileLayer.offline('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
            maxZoom: 20,
            subdomains:['mt0','mt1','mt2','mt3'],
            attribution: '&copy; Google Maps'
        }).addTo(map);
        console.log("[Map - initMap] Offline tile layer added.");

        // Initialize leaflet.dexie controls for saving tiles
        const saveTilesControl = L.control.savetiles(baseLayer, {
            zoomlevels: [13, 14, 15, 16, 17, 18], // Specify zoom levels to save, adjust as needed
            confirmSave: function(status, saveCallback) {
                const totalTiles = status._tilesforSave.length;
                if (totalTiles === 0) {
                    alert("No tiles to save in the current view at the selected zoom levels. Try zooming in or panning.");
                    return;
                }
                if (confirm(`Save ${totalTiles} map tiles for offline use? This might take a while.`)) {
                    const mapName = prompt("Enter a name for this offline map area (e.g., 'Ram Pump Trail Area'):", "Offline Map Area");
                    if (mapName) {
                        saveCallback(mapName);
                    } else {
                        alert("Save cancelled. No name provided.");
                    }
                } else {
                    alert("Save cancelled.");
                }
            },
            confirmDelete: function(mapNameToDelete, deleteCallback) {
                if (confirm(`Delete the offline map area '${mapNameToDelete}'?`)) {
                    deleteCallback();
                }
            },
            saveText: '<img src="../assets/icons/download-icon.png" alt="Save" style="width:16px; height:16px;"> Save View',
            rmText: '<img src="../assets/icons/delete-icon.png" alt="Delete" style="width:16px; height:16px;"> Delete Saved Areas'
        });
        saveTilesControl.addTo(map);
        console.log("[Map - initMap] Save tiles control added.");

        // Attempt to open the IndexedDB database
        saveTilesControl.openDB().then(() => { // Corrected: Call openDB on the control
            console.log("[Map - initMap] Successfully opened/initialized IndexedDB for map tiles via saveTilesControl.");
        }).catch(err => {
            console.error("[Map - initMap] Error opening IndexedDB for map tiles via saveTilesControl:", err);
            alert("Could not initialize offline map storage. Offline maps may not be available.");
        });

        // Populate trail select dropdown
        const trailSelect = document.getElementById('trail-select');
        if (trailSelect) {
            const trails = getAllTrails();
            // Clear existing options except the first 'No Trails' one
            while (trailSelect.options.length > 1) {
                trailSelect.remove(1);
            }
            trails.forEach(trail => {
                const option = document.createElement('option');
                option.value = trail.id;
                option.textContent = trail.name;
                trailSelect.appendChild(option);
            });
            console.log("[Map - initMap] Trail select dropdown populated.");

            // Event listener for trail selection dropdown
            trailSelect.addEventListener('change', (event) => {
                const selectedTrailId = event.target.value;
                console.log(`[Map - initMap] Trail selected via dropdown: ${selectedTrailId}`);
                
                // Always clear custom KML layers when selecting from dropdown
                if (window.currentlyDisplayedKMLLayer) {
                    console.log("[Map - initMap] Clearing custom KML layer on trail selection");
                    map.removeLayer(window.currentlyDisplayedKMLLayer);
                    window.currentlyDisplayedKMLLayer = null;
                }
                
                // Clear all existing trail layers to ensure clean state
                Object.keys(trailLayers).forEach(key => {
                    const layer = trailLayers[key];
                    if (map.hasLayer(layer)) {
                        console.log(`[Map - initMap] Removing trail layer: ${key}`);
                        map.removeLayer(layer);
                    }
                });
                
                displayTrail(selectedTrailId); // Call async displayTrail
            });
        } else {
            console.error("[Map - initMap] Trail select dropdown element not found.");
        }

        // Display 'none' trails initially (no trails shown)
        console.log("[Map - initMap] Scheduling initial display with 'none' (no trails).");
        setTimeout(() => displayTrail('none'), 100);

        // GPS Tracking Button
        const trackBtn = document.getElementById('track-location-btn');
        if (trackBtn) {
            trackBtn.addEventListener('click', trackUserLocation);
            console.log("[Map - initMap] GPS tracking button listener added.");
        } else {
            console.error("[Map - initMap] Track location button element not found.");
        }
        console.log("[Map - initMap] Map initialization complete.");
    } catch (error) {
        console.error("[Map - initMap] CRITICAL ERROR during map initialization:", error);
        const mapContainer = document.getElementById("map");
        if (mapContainer) {
            mapContainer.innerHTML = "<p style='color: red;'>CRITICAL ERROR: Failed to initialize map. Check console.</p>";
        }
    }
}

// Initialize map when the DOM is ready
// This should only run once. If app.js calls initMap, this might be redundant or cause issues.
// Consider letting app.js manage the initialization entirely.
// For now, keep it but add checks in initMap to prevent re-initialization.
document.addEventListener('DOMContentLoaded', () => {
    console.log("[Map] DOMContentLoaded event fired. Calling initMap().");
    initMap();
});
console.log("[Map] map.js loaded.");

