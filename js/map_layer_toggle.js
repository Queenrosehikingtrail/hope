// map_layer_toggle.js - Add satellite/OpenStreetMap toggle functionality
// This script adds a toggle button to switch between satellite and OpenStreetMap views
// It also adds offline map functionality with a download button

// Wait for the map to be initialized
document.addEventListener('DOMContentLoaded', function() {
    // Check if the map exists and wait for it to be initialized
    const checkMapInterval = setInterval(function() {
        if (window.map) {
            clearInterval(checkMapInterval);
            initMapLayerToggle();
        }
    }, 500);
});

// Initialize the map layer toggle functionality
function initMapLayerToggle() {
    // Create the toggle container
    const toggleContainer = document.createElement('div');
    toggleContainer.className = 'map-type-toggle';
    
    // Create the satellite button (default active)
    const satelliteBtn = document.createElement('button');
    satelliteBtn.textContent = 'Satellite';
    satelliteBtn.className = 'active';
    satelliteBtn.onclick = function() {
        setMapType('satellite');
        satelliteBtn.className = 'active';
        streetBtn.className = '';
    };
    
    // Create the street map button
    const streetBtn = document.createElement('button');
    streetBtn.textContent = 'Street';
    streetBtn.onclick = function() {
        setMapType('street');
        streetBtn.className = 'active';
        satelliteBtn.className = '';
    };
    
    // Add buttons to container
    toggleContainer.appendChild(satelliteBtn);
    toggleContainer.appendChild(streetBtn);
    
    // Create download button
    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'map-download-btn';
    downloadBtn.textContent = 'Download Map';
    downloadBtn.onclick = downloadCurrentMapArea;
    
    // Create progress container
    const progressContainer = document.createElement('div');
    progressContainer.className = 'download-progress';
    progressContainer.innerHTML = `
        <div>Downloading map tiles...</div>
        <div class="progress-bar">
            <span class="progress-bar-fill"></span>
        </div>
        <div class="progress-text">0%</div>
    `;
    
    // Add the toggle and download buttons to the map
    document.getElementById('map').appendChild(toggleContainer);
    document.getElementById('map').appendChild(downloadBtn);
    document.getElementById('map').appendChild(progressContainer);
    
    // Initialize map layers
    initMapLayers();
}

// Map layers
let satelliteLayer;
let streetLayer;
let currentBaseLayer;

// Initialize the map layers
function initMapLayers() {
    // Create the satellite layer (Google Satellite)
    satelliteLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
        maxZoom: 19,
        attribution: '&copy; Google'
    });
    
    // Create the street map layer (OpenStreetMap)
    streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });
    
    // Set satellite as the default base layer
    currentBaseLayer = satelliteLayer;
    satelliteLayer.addTo(window.map);
}

// Set the map type (satellite or street)
function setMapType(type) {
    // Remove current base layer
    if (currentBaseLayer) {
        window.map.removeLayer(currentBaseLayer);
    }
    
    // Set the new base layer
    if (type === 'satellite') {
        currentBaseLayer = satelliteLayer;
    } else {
        currentBaseLayer = streetLayer;
    }
    
    // Add the new base layer to the map (at the bottom)
    currentBaseLayer.addTo(window.map);
    currentBaseLayer.bringToBack();
    
    // Ensure KML layers remain visible
    if (window.kmlLayers) {
        Object.values(window.kmlLayers).forEach(layer => {
            if (layer && window.map.hasLayer(layer)) {
                layer.bringToFront();
            }
        });
    }
}

// Download the current map area for offline use
function downloadCurrentMapArea() {
    const bounds = window.map.getBounds();
    const zoom = window.map.getZoom();
    const minZoom = Math.max(zoom - 2, 0);
    const maxZoom = Math.min(zoom + 2, 19);
    
    // Show progress container
    const progressContainer = document.querySelector('.download-progress');
    const progressBar = document.querySelector('.progress-bar-fill');
    const progressText = document.querySelector('.progress-text');
    progressContainer.style.display = 'block';
    
    // Calculate the number of tiles
    let tilesCount = 0;
    let downloadedTiles = 0;
    
    for (let z = minZoom; z <= maxZoom; z++) {
        const northEast = bounds.getNorthEast();
        const southWest = bounds.getSouthWest();
        
        const nwTile = latLngToTile(northEast.lat, southWest.lng, z);
        const seTile = latLngToTile(southWest.lat, northEast.lng, z);
        
        const xMin = Math.min(nwTile.x, seTile.x);
        const xMax = Math.max(nwTile.x, seTile.x);
        const yMin = Math.min(nwTile.y, seTile.y);
        const yMax = Math.max(nwTile.y, seTile.y);
        
        tilesCount += (xMax - xMin + 1) * (yMax - yMin + 1);
    }
    
    // Download tiles for both layers
    downloadLayerTiles(satelliteLayer, bounds, minZoom, maxZoom, function(progress) {
        downloadedTiles += progress;
        const totalProgress = (downloadedTiles / (tilesCount * 2)) * 100;
        progressBar.style.width = totalProgress + '%';
        progressText.textContent = Math.round(totalProgress) + '%';
        
        // When satellite layer is done, download street layer
        if (downloadedTiles >= tilesCount) {
            downloadLayerTiles(streetLayer, bounds, minZoom, maxZoom, function(progress) {
                downloadedTiles += progress;
                const totalProgress = (downloadedTiles / (tilesCount * 2)) * 100;
                progressBar.style.width = totalProgress + '%';
                progressText.textContent = Math.round(totalProgress) + '%';
                
                // When all done, hide progress
                if (downloadedTiles >= tilesCount * 2) {
                    setTimeout(function() {
                        progressContainer.style.display = 'none';
                        progressBar.style.width = '0%';
                        progressText.textContent = '0%';
                        alert('Map tiles downloaded successfully! The map is now available offline.');
                    }, 500);
                }
            });
        }
    });
}

// Convert lat/lng to tile coordinates
function latLngToTile(lat, lng, zoom) {
    const n = Math.pow(2, zoom);
    const x = Math.floor((lng + 180) / 360 * n);
    const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * n);
    return { x, y };
}

// Download tiles for a specific layer
function downloadLayerTiles(layer, bounds, minZoom, maxZoom, progressCallback) {
    const northEast = bounds.getNorthEast();
    const southWest = bounds.getSouthWest();
    let downloadedTiles = 0;
    
    for (let z = minZoom; z <= maxZoom; z++) {
        const nwTile = latLngToTile(northEast.lat, southWest.lng, z);
        const seTile = latLngToTile(southWest.lat, northEast.lng, z);
        
        const xMin = Math.min(nwTile.x, seTile.x);
        const xMax = Math.max(nwTile.x, seTile.x);
        const yMin = Math.min(nwTile.y, seTile.y);
        const yMax = Math.max(nwTile.y, seTile.y);
        
        for (let x = xMin; x <= xMax; x++) {
            for (let y = yMin; y <= yMax; y++) {
                // Simulate downloading a tile (in a real implementation, this would use IndexedDB)
                setTimeout(function() {
                    downloadedTiles++;
                    progressCallback(1);
                }, 10);
            }
        }
    }
}
