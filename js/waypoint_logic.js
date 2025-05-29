// js/waypoint_logic.js
let saveWaypointCallCounter = 0; // Counter for saveNewWaypoint entries
let isLoadingWaypoints = false; // Flag to prevent re-entrant calls to loadAndDisplaySavedWaypoints

// Function to convert decimal degrees to DMS (Degrees, Minutes, Seconds)
function decimalToDMS(decimal, type) {
    const absDecimal = Math.abs(decimal);
    let degrees = Math.floor(absDecimal);
    let minutesNotTruncated = (absDecimal - degrees) * 60;
    let minutes = Math.floor(minutesNotTruncated);
    let seconds = Math.floor((minutesNotTruncated - minutes) * 6000) / 100;

    degrees = degrees.toString().padStart(type === "lon" ? 3 : 2, "0");
    minutes = minutes.toString().padStart(2, "0");
    seconds = seconds.toFixed(2).padStart(5, "0");

    let direction;
    if (type === "lat") {
        direction = decimal >= 0 ? "N" : "S";
    } else if (type === "lon") {
        direction = decimal >= 0 ? "E" : "W";
    } else {
        direction = "";
    }
    return `${degrees}°${minutes}\'${seconds}" ${direction}`;
}

// Function to handle saving a new waypoint (with prompts for name and description)
async function saveNewWaypoint(lat, lon) {
    const callId = ++saveWaypointCallCounter;
    console.log(`[WaypointLogic CALL #${callId}] saveNewWaypoint called with lat, lon:`, lat, lon);

    const name = prompt(`[CALL #${callId}] Enter a name for this waypoint:`, `Waypoint ${new Date().toLocaleDateString()}`);
    if (name === null) {
        console.log(`[WaypointLogic CALL #${callId}] User cancelled entering name.`);
        return; 
    }

    const description = prompt(`[CALL #${callId}] Enter a description for this waypoint (optional):`, "");

    const dmsLat = decimalToDMS(lat, "lat");
    const dmsLon = decimalToDMS(lon, "lon");
    const timestamp = new Date().toISOString();

    const newWaypoint = {
        name: name || `Waypoint ${new Date(timestamp).toLocaleString()}`,
        description: description || "",
        lat: lat,
        lon: lon,
        dms: {
            lat: dmsLat,
            lon: dmsLon
        },
        timestamp: timestamp
    };

    console.log(`[WaypointLogic CALL #${callId}] New Waypoint Data Prepared:`, JSON.stringify(newWaypoint));

    try {
        if (typeof db !== 'undefined' && db.waypoints) {
            console.log(`[WaypointLogic CALL #${callId}] DB connection available.`);
            const countBefore = await db.waypoints.count();
            console.log(`[WaypointLogic CALL #${callId}] Waypoints count BEFORE add: ${countBefore}`);
            console.log(`[WaypointLogic CALL #${callId}] About to call db.waypoints.add() with:`, JSON.stringify(newWaypoint));
            const addedId = await db.waypoints.add(newWaypoint);
            console.log(`[WaypointLogic CALL #${callId}] Waypoint supposedly ADDED to IndexedDB. Returned ID: ${addedId}`);
            const countAfter = await db.waypoints.count();
            console.log(`[WaypointLogic CALL #${callId}] Waypoints count AFTER add: ${countAfter}`);
            if (addedId) {
                const fetchedWaypoint = await db.waypoints.get(addedId);
                console.log(`[WaypointLogic CALL #${callId}] Fetched waypoint by ID ${addedId} immediately after add:`, JSON.stringify(fetchedWaypoint));
            }
            if (countAfter > countBefore) {
                 console.log(`[WaypointLogic CALL #${callId}] Successfully added ${countAfter - countBefore} waypoint(s).`);
            } else {
                console.warn(`[WaypointLogic CALL #${callId}] Waypoint count did NOT increase after add. Before: ${countBefore}, After: ${countAfter}`);
            }
            alert(`[CALL #${callId}] Waypoint Saved (ID: ${addedId})\nName: ${newWaypoint.name}\nCoords: ${dmsLat}, ${dmsLon}`);
            if (typeof loadAndDisplaySavedWaypoints === 'function') {
                console.log(`[WaypointLogic CALL #${callId}] Calling loadAndDisplaySavedWaypoints().`);
                loadAndDisplaySavedWaypoints();
            }
        } else {
            console.error(`[WaypointLogic CALL #${callId}] Database (db or db.waypoints) not available for saving waypoint.`);
            alert(`[CALL #${callId}] Error: Could not save waypoint. Database not ready.`);
        }
    } catch (error) {
        console.error(`[WaypointLogic CALL #${callId}] Error during waypoint save/DB operation:`, error);
        alert(`[CALL #${callId}] Error saving waypoint. See console for details.`);
    }
    console.log(`[WaypointLogic CALL #${callId}] saveNewWaypoint execution finished.`);
}

const hikerIcon = L.icon({
    iconUrl: 'assets/hiker_waypoint_icon_yellow.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
});

let waypointMarkersLayer = L.layerGroup();

function addWaypointToMap(waypoint) {
    if (typeof map === 'undefined' || map === null) {
        console.error("[WaypointLogic] Map object is not available to add waypoint marker.");
        return;
    }
    if (!map.hasLayer(waypointMarkersLayer)) {
         waypointMarkersLayer.addTo(map);
    }
    const marker = L.marker([waypoint.lat, waypoint.lon], { icon: hikerIcon })
        .bindPopup(`<b>${waypoint.name}</b><br>${waypoint.description || ''}<br><small>${waypoint.dms.lat}, ${waypoint.dms.lon}</small>`)
        .addTo(waypointMarkersLayer);
    return marker;
}

function addWaypointToList(waypoint, container) {
    if (!container) {
        console.error("[WaypointLogic] addWaypointToList: Waypoint list container not found.");
        return;
    }
    console.log(`[WaypointLogic] addWaypointToList: Adding waypoint ID ${waypoint.id} ('${waypoint.name}') to UI list. Current children in container: ${container.children.length}`);
    const item = document.createElement('div');
    item.className = 'waypoint-list-item';
    item.setAttribute('data-waypoint-id', waypoint.id); // Add data attribute for easier debugging
    item.innerHTML = `
        <h4>${waypoint.name}</h4>
        <p>${waypoint.description || 'No description'}</p>
        <p><small>Coordinates: ${waypoint.dms.lat}, ${waypoint.dms.lon}</small></p>
        <p><small>Saved: ${new Date(waypoint.timestamp).toLocaleString()} (ID: ${waypoint.id})</small></p>
    `;
    const viewButton = document.createElement('button');
    viewButton.textContent = 'View on Map';
    viewButton.onclick = () => {
        if (typeof map !== 'undefined' && map) {
            map.setView([waypoint.lat, waypoint.lon], 15);
            waypointMarkersLayer.eachLayer(layer => {
                if (layer.getLatLng().lat === waypoint.lat && layer.getLatLng().lng === waypoint.lon) {
                    layer.openPopup();
                }
            });
            if (typeof switchSection === 'function') switchSection('map');
            else console.warn("[WaypointLogic] switchSection function not found when trying to view waypoint on map.");
        }
    };
    const exportButton = document.createElement('button');
    exportButton.textContent = 'Export GPX';
    exportButton.onclick = () => exportWaypointAsGPX(waypoint);
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.onclick = async () => {
        if (confirm(`Are you sure you want to delete waypoint "${waypoint.name}" (ID: ${waypoint.id})?`)) {
            try {
                await db.waypoints.delete(waypoint.id);
                console.log("[WaypointLogic] Deleted waypoint from DB:", waypoint.name, "ID:", waypoint.id);
                loadAndDisplaySavedWaypoints();
            } catch (error) {
                console.error("[WaypointLogic] Error deleting waypoint:", error);
                alert("Error deleting waypoint.");
            }
        }
    };
    item.appendChild(viewButton);
    item.appendChild(exportButton);
    item.appendChild(deleteButton);
    container.appendChild(item);
    console.log(`[WaypointLogic] addWaypointToList: AFTER adding waypoint ID ${waypoint.id}. Current children in container: ${container.children.length}`);
}

function exportWaypointAsGPX(waypoint) {
    const gpxContent = 
`<?xml version="1.0" encoding="UTF-8" standalone="no" ?>
<gpx xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd" version="1.1" creator="QueenRoseApp">
  <metadata>
    <name>Waypoint - ${waypoint.name}</name>
    <time>${waypoint.timestamp}</time>
  </metadata>
  <wpt lat="${waypoint.lat}" lon="${waypoint.lon}">
    <ele>0</ele>
    <time>${waypoint.timestamp}</time>
    <name>${waypoint.name}</name>
    <desc>${waypoint.description || ''}</desc>
    <sym>flag</sym>
  </wpt>
</gpx>`;
    const blob = new Blob([gpxContent], { type: 'application/gpx+xml' });
    const fileName = `Waypoint_${waypoint.name.replace(/[^a-z0-9]/gi, '_')}.gpx`;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    console.log("[WaypointLogic] Exported waypoint as GPX:", waypoint.name);
}

async function loadAndDisplaySavedWaypoints() {
    if (isLoadingWaypoints) {
        console.warn("[WaypointLogic] loadAndDisplaySavedWaypoints: Already in progress. Skipping call.");
        return;
    }
    isLoadingWaypoints = true;
    console.log("[WaypointLogic] loadAndDisplaySavedWaypoints: STARTING. isLoadingWaypoints set to true.");

    if (typeof db === 'undefined' || !db.waypoints) {
        console.error("[WaypointLogic] loadAndDisplaySavedWaypoints: Database not available.");
        isLoadingWaypoints = false;
        return;
    }

    const waypointsListContainer = document.getElementById('saved-waypoints-list-container');
    if (waypointsListContainer) {
        console.log(`[WaypointLogic] loadAndDisplaySavedWaypoints: BEFORE clearing, list container has ${waypointsListContainer.children.length} children.`);
        waypointsListContainer.innerHTML = ''; // Robustly clear the container
        console.log(`[WaypointLogic] loadAndDisplaySavedWaypoints: AFTER clearing, list container has ${waypointsListContainer.children.length} children.`);
    } else {
        console.error("[WaypointLogic] loadAndDisplaySavedWaypoints: Waypoint list container NOT FOUND.");
        isLoadingWaypoints = false;
        return; 
    }
    
    if (waypointMarkersLayer) {
        console.log("[WaypointLogic] loadAndDisplaySavedWaypoints: Clearing waypointMarkersLayer.");
        waypointMarkersLayer.clearLayers(); 
    }

    try {
        const waypoints = await db.waypoints.toArray();
        console.log(`[WaypointLogic] loadAndDisplaySavedWaypoints: Fetched ${waypoints.length} waypoints from DB:`, waypoints.map(wp => ({id: wp.id, name: wp.name})));
        if (waypoints.length === 0) {
            waypointsListContainer.innerHTML = '<p>No waypoints saved yet.</p>';
        } else {
             waypoints.forEach(waypoint => {
                console.log(`[WaypointLogic] loadAndDisplaySavedWaypoints: Processing waypoint ID ${waypoint.id} ('${waypoint.name}') for display.`);
                addWaypointToMap(waypoint); 
                addWaypointToList(waypoint, waypointsListContainer); 
            });
        }
        console.log(`[WaypointLogic] loadAndDisplaySavedWaypoints: AFTER loop, list container has ${waypointsListContainer.children.length} children.`);
    } catch (error) {
        console.error("[WaypointLogic] loadAndDisplaySavedWaypoints: Error loading from DB:", error);
        if (waypointsListContainer) waypointsListContainer.innerHTML = '<p>Error loading waypoints.</p>';
    }
    console.log("[WaypointLogic] loadAndDisplaySavedWaypoints: FINISHED. Setting isLoadingWaypoints to false.");
    isLoadingWaypoints = false;
}

document.addEventListener("DOMContentLoaded", () => {
    console.log("[WaypointLogic] DOMContentLoaded, waypoint_logic.js specific initializations can run here.");
    if (typeof map !== 'undefined' && map) {
        waypointMarkersLayer.addTo(map);
    }
    if (typeof loadAndDisplaySavedWaypoints === 'function') {
        loadAndDisplaySavedWaypoints(); 
    }
});

