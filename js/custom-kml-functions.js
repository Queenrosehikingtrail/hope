// Function to clear custom KML layers and reset trail selection
function clearCustomKmlLayers(resetSelector = true) {
    console.log("[CustomKML] Clearing any custom KML layers");
    
    // Clear the current custom KML layer if it exists
    if (window.currentlyDisplayedKMLLayer) {
        console.log("[CustomKML] Removing custom KML layer from map");
        map.removeLayer(window.currentlyDisplayedKMLLayer);
        window.currentlyDisplayedKMLLayer = null;
    }
    
    // Reset the trail selector to "No Trails" option if requested
    if (resetSelector) {
        const trailSelector = document.getElementById("trail-select");
        if (trailSelector) {
            console.log("[CustomKML] Resetting trail selector to 'none'");
            trailSelector.value = "none";
            // Trigger the change event to ensure map is updated
            const event = new Event('change');
            trailSelector.dispatchEvent(event);
        }
    }
}

// Function to handle custom KML display
function displayCustomKml(kmlData) {
    console.log("[CustomKML] Displaying custom KML");
    
    // First, clear any existing trail layers
    if (window.currentTrailLayer) {
        console.log("[CustomKML] Removing current trail layer");
        map.removeLayer(window.currentTrailLayer);
        window.currentTrailLayer = null;
    }
    
    // Remove all trail layers if any are displayed
    if (window.trailLayers) {
        Object.keys(window.trailLayers).forEach(key => {
            const layer = window.trailLayers[key];
            if (map.hasLayer(layer)) {
                console.log(`[CustomKML] Removing trail layer: ${key}`);
                map.removeLayer(layer);
            }
        });
    }
    
    // Reset the trail selector to "No Trails" option
    const trailSelector = document.getElementById("trail-select");
    if (trailSelector) {
        console.log("[CustomKML] Setting trail selector to 'none'");
        trailSelector.value = "none";
    }
    
    // Now display the custom KML
    // Implementation depends on how your app handles KML display
    console.log("[CustomKML] Custom KML display logic complete");
}

// Make functions available globally
window.clearCustomKmlLayers = clearCustomKmlLayers;
window.displayCustomKml = displayCustomKml;
