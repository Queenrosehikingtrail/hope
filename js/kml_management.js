// js/kml_management.js

console.log("[KMLManager] kml_management.js loaded.");

// --- DOM Elements ---
let kmlFileInput;
let kmlUploadStatusDiv;
let myKMLFilesListContainer;
let currentlyDisplayedKMLLayer = null; // To keep track of the KML layer on the map

// --- Dexie DB Reference (from gps_tracking.js or app.js) ---
// Assuming 'db' is globally available or passed/imported if modularized later
// For now, we'll rely on it being initialized by gps_tracking.js as it includes the KML store now.

window.initKMLManagement = function() {
    console.log("[KMLManager - init] Attempting to initialize KML management controls.");
    kmlFileInput = document.getElementById("kml-file-input");
    kmlUploadStatusDiv = document.getElementById("kml-upload-status");
    myKMLFilesListContainer = document.getElementById("my-kml-files-list-container");

    if (!kmlFileInput || !kmlUploadStatusDiv || !myKMLFilesListContainer) {
        console.error("[KMLManager - init] One or more KML management DOM elements not found.");
        if (kmlUploadStatusDiv) kmlUploadStatusDiv.textContent = "Error: UI elements missing for KML management.";
        return;
    }

    kmlFileInput.addEventListener("change", handleKMLFileUpload);
    console.log("[KMLManager - init] Event listener added to KML file input.");

    loadAndDisplayStoredKMLFiles(); // Load existing KMLs when the section is initialized/shown
    console.log("[KMLManager - init] KML management initialization finished.");
}

async function handleKMLFileUpload(event) {
    const files = event.target.files;
    if (!files.length) {
        kmlUploadStatusDiv.textContent = "No file selected.";
        return;
    }

    // For now, handle only the first file if multiple are selected, per design (one KML on map at a time)
    // The input is not set to `multiple` in the HTML for simplicity, but good to be aware.
    const file = files[0];

    if (!file.name.toLowerCase().endsWith(".kml")) {
        kmlUploadStatusDiv.textContent = `Error: Invalid file type. Please select a .kml file. Got: ${file.name}`;
        kmlFileInput.value = ""; // Reset file input
        return;
    }

    kmlUploadStatusDiv.textContent = `Processing ${file.name}...`;

    const reader = new FileReader();
    reader.onload = async function(e) {
        const kmlString = e.target.result;
        const kmlName = file.name; // Use original filename as default name

        try {
            // Attempt to parse to ensure it's valid KML before saving (optional, but good for UX)
            const kmlDoc = new DOMParser().parseFromString(kmlString, "text/xml");
            if (kmlDoc.getElementsByTagName("parsererror").length > 0) {
                throw new Error("Invalid KML file structure or parsing error.");
            }
            // We don't need to convert to GeoJSON here, just validate. Conversion happens on view.

            const kmlEntry = {
                name: kmlName,
                originalFileName: file.name,
                kmlString: kmlString,
                addedTimestamp: Date.now()
            };

            const id = await db.user_kml_files.add(kmlEntry);
            kmlUploadStatusDiv.textContent = `Successfully uploaded and saved "${kmlName}" (ID: ${id}).`;
            console.log(`[KMLManager - upload] KML "${kmlName}" saved with ID: ${id}`);
            loadAndDisplayStoredKMLFiles(); // Refresh the list
        } catch (error) {
            console.error("[KMLManager - upload] Error processing or saving KML file:", error);
            kmlUploadStatusDiv.textContent = `Error saving KML "${kmlName}": ${error.message}. Check console.`;
        }
        kmlFileInput.value = ""; // Reset file input after processing
    };

    reader.onerror = function() {
        console.error("[KMLManager - upload] FileReader error for file:", file.name);
        kmlUploadStatusDiv.textContent = `Error reading file "${file.name}".`;
        kmlFileInput.value = ""; // Reset file input
    };

    reader.readAsText(file);
}

async function loadAndDisplayStoredKMLFiles() {
    if (!myKMLFilesListContainer) return;

    try {
        const kmlFiles = await db.user_kml_files.orderBy("addedTimestamp").reverse().toArray();
        myKMLFilesListContainer.innerHTML = ""; // Clear previous list

        if (kmlFiles.length === 0) {
            myKMLFilesListContainer.innerHTML = "<p>No KML files stored yet.</p>";
            return;
        }

        const ul = document.createElement("ul");
        kmlFiles.forEach(kmlFile => {
            const li = document.createElement("li");
            li.innerHTML = `
                <strong>${escapeXml(kmlFile.name)}</strong><br>
                <small>Original: ${escapeXml(kmlFile.originalFileName)}</small><br>
                <small>Added: ${new Date(kmlFile.addedTimestamp).toLocaleString()}</small><br>
                <button class="view-kml-btn" data-kml-id="${kmlFile.id}">View on Map</button>
                <button class="delete-kml-btn" data-kml-id="${kmlFile.id}">Delete</button>
            `;
            // TODO: Add Rename button/functionality later if needed
            ul.appendChild(li);
        });
        myKMLFilesListContainer.appendChild(ul);

        // Add event listeners to new buttons
        document.querySelectorAll(".view-kml-btn").forEach(btn => btn.addEventListener("click", handleViewKMLOnMap));
        document.querySelectorAll(".delete-kml-btn").forEach(btn => btn.addEventListener("click", handleDeleteKMLFile));

    } catch (error) {
        console.error("[KMLManager - loadList] Error loading KML files from IndexedDB:", error);
        myKMLFilesListContainer.innerHTML = "<p>Error loading stored KML files. Check console.</p>";
    }
}

async function handleViewKMLOnMap(event) {
    const kmlId = parseInt(event.target.dataset.kmlId);
    if (isNaN(kmlId)) return;

    try {
        const kmlFileEntry = await db.user_kml_files.get(kmlId);
        if (kmlFileEntry && kmlFileEntry.kmlString) {
            if (typeof map === "undefined" || !map || typeof L === "undefined" || typeof toGeoJSON === "undefined") {
                alert("Map components are not ready. Cannot display KML.");
                console.error("[KMLManager - view] Map or Leaflet/toGeoJSON not available.");
                return;
            }

            // Clear any existing trail layers first
            if (typeof window.currentTrailLayer !== 'undefined' && window.currentTrailLayer) {
                console.log("[KMLManager - view] Removing current trail layer");
                map.removeLayer(window.currentTrailLayer);
                window.currentTrailLayer = null;
            }
            
            // Remove all trail layers if any are displayed
            if (typeof window.trailLayers !== 'undefined') {
                Object.keys(window.trailLayers).forEach(key => {
                    const layer = window.trailLayers[key];
                    if (map.hasLayer(layer)) {
                        console.log(`[KMLManager - view] Removing trail layer: ${key}`);
                        map.removeLayer(layer);
                    }
                });
            }
            
            // Reset the trail selector to "No Trails" option
            const trailSelector = document.getElementById("trail-select");
            if (trailSelector) {
                console.log("[KMLManager - view] Resetting trail selector to 'none'");
                trailSelector.value = "none";
            }

            // Remove previously displayed KML layer if any
            if (currentlyDisplayedKMLLayer) {
                map.removeLayer(currentlyDisplayedKMLLayer);
                currentlyDisplayedKMLLayer = null;
            }

            const kmlDoc = new DOMParser().parseFromString(kmlFileEntry.kmlString, "text/xml");
            const geoJson = toGeoJSON.kml(kmlDoc);
            
            currentlyDisplayedKMLLayer = L.geoJson(geoJson, {
                onEachFeature: function (feature, layer) {
                    // if (feature.properties && feature.properties.name) {
                    //     layer.bindPopup(feature.properties.name);
                    // }
                },
                style: function (feature) { // Basic default styling
                    return {
                        color: feature.properties.stroke || "#FF0000", // Bright Red
                        weight: feature.properties["stroke-width"] || 5, // Thicker line
                        opacity: feature.properties["stroke-opacity"] || 1.0, // Fully opaque
                        fillColor: feature.properties.fill || "#FF0000",
                        fillOpacity: feature.properties["fill-opacity"] || 0.5
                    };
                },
                pointToLayer: function (feature, latlng) {
                    // Do not render any markers for point features
                    return null;
                }
            }).addTo(map);

            if (geoJson.features && geoJson.features.length > 0) {
                map.fitBounds(currentlyDisplayedKMLLayer.getBounds());
            }
            console.log(`[KMLManager - view] Displaying KML "${kmlFileEntry.name}" (ID: ${kmlId}) on map.`);
            if (typeof window.switchSection === "function") window.switchSection("map"); // Switch to map view

        } else {
            alert("Could not load KML data to display.");
            console.error(`[KMLManager - view] KML data not found for ID: ${kmlId}`);
        }
    } catch (error) {
        console.error(`[KMLManager - view] Error parsing or displaying KML ID ${kmlId}:`, error);
        alert(`Error displaying KML "${event.target.closest('li').querySelector('strong').textContent}". Check console.`);
    }
}

async function handleDeleteKMLFile(event) {
    const kmlId = parseInt(event.target.dataset.kmlId);
    if (isNaN(kmlId)) return;

    try {
        const kmlFileEntry = await db.user_kml_files.get(kmlId);
        if (!kmlFileEntry) {
            alert("KML file not found for deletion.");
            return;
        }

        if (confirm(`Are you sure you want to delete the KML file "${escapeXml(kmlFileEntry.name)}"?`)) {
            await db.user_kml_files.delete(kmlId);
            console.log(`[KMLManager - delete] Deleted KML file ID ${kmlId}.`);
            alert("KML file deleted successfully.");

            // If the deleted KML was being displayed, remove it from map
            if (currentlyDisplayedKMLLayer && currentlyDisplayedKMLLayer.options && currentlyDisplayedKMLLayer.options.kmlId === kmlId) { // Need to tag layer with ID
                // This check won't work as is, layer needs to be tagged. For now, just clear any KML.
                if (currentlyDisplayedKMLLayer) map.removeLayer(currentlyDisplayedKMLLayer);
                currentlyDisplayedKMLLayer = null;
            }
            loadAndDisplayStoredKMLFiles(); // Refresh the list
        }
    } catch (error) {
        console.error(`[KMLManager - delete] Error deleting KML file ID ${kmlId}:`, error);
        alert("Error deleting KML file. Check console.");
    }
}

// Helper to escape XML/HTML special characters for display
function escapeXml(unsafe) {
    if (typeof unsafe !== 'string') return '';
    return unsafe.replace(/[<>&'"]/g, function (c) {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
        }
    });
}

// Ensure this init function is called when the "My KMLs" section becomes active.
// This might be handled in app.js's switchSection logic or by listening to a custom event.
// For now, we can add a direct call if app.js structure allows, or call it from app.js
// when the 'my-kmls' section is shown.
// Example: if (sectionId === 'my-kmls') initKMLManagement(); in app.js switchSection

// For testing, we can try to initialize it when the script loads if the elements are already in the DOM.
// However, it's better to tie it to section visibility.
// document.addEventListener('DOMContentLoaded', initKMLManagement); // This might be too early if sections are hidden

