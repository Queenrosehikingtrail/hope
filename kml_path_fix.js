/**
 * Direct KML Path Override for GitHub Pages
 * 
 * This script completely overrides the app's KML loading logic to use normalized filenames
 * and removes markers from the map display
 */

// Map of trail IDs to their normalized KML filenames (without spaces or special characters)
const kmlFilenameMap = {
  'ram-pump': 'rampump.kml',
  'oukraal': 'oukraal.kml',
  'mtb-1': 'mtbtrail1.kml',
  'matumi': 'matumi.kml',
  'devils-knuckles': 'devilsknuckles.kml',
  'cupids-falls': 'cupidsfalls.kml',
  '2-day-full': '2dayfull.kml',
  '2-day-1': '2day1.kml',
  '2-day-2': '2day2.kml',
  '3-day-full': '3dayfull.kml',
  '3-day-1': '3day1.kml',
  '3-day-2': '3day2.kml',
  '3-day-3': '3day3.kml',
  '4-day-full': '4dayfull.kml',
  '4-day-1': '4day1.kml',
  '4-day-2': '4day2.kml',
  '4-day-3': '4day3.kml',
  '4-day-4': '4day4.kml',
  '5-day-full': '5dayfull.kml',
  '5-day-1': '5day1.kml',
  '5-day-2': '5day2.kml',
  '5-day-3': '5day3.kml',
  '5-day-4': '5day4.kml',
  '5-day-5': '5day5.kml',
  '6-day-full': '6dayfull.kml',
  '6-day-1': '6day1.kml',
  '6-day-2': '6day2.kml',
  '6-day-3': '6day3.kml',
  '6-day-4': '6day4.kml',
  '6-day-5': '6day5.kml',
  '6-day-6': '6day6.kml'
};

// Get the base URL for the current deployment
function getBaseUrl() {
  // Extract the base path from the current URL
  const pathParts = window.location.pathname.split('/');
  let basePath = '';
  
  // If deployed in a subdirectory, include it in the base path
  if (pathParts.length > 2) {
    // Remove the last part if it's a file (like index.html)
    const lastPart = pathParts[pathParts.length - 1];
    if (lastPart.includes('.')) {
      pathParts.pop();
    }
    
    // Construct the base path
    basePath = pathParts.join('/');
    if (!basePath.endsWith('/')) {
      basePath += '/';
    }
  }
  
  // Ensure there's always a trailing slash after the host
  return `${window.location.protocol}//${window.location.host}${basePath}`;
}

// Store the original fetch function
const originalFetch = window.fetch;

// Override the fetch function to intercept KML file requests
window.fetch = function(url, options) {
  // Check if this is a KML file request
  if (typeof url === 'string' && url.includes('.kml')) {
    console.log(`[KML Direct Override] Intercepted fetch for: ${url}`);
    
    // Extract the trail ID from the URL if possible
    let trailId = null;
    
    // Try to match trail ID patterns in the URL
    for (const id in kmlFilenameMap) {
      if (url.toLowerCase().includes(id)) {
        trailId = id;
        break;
      }
    }
    
    // If we found a trail ID, use the normalized filename
    if (trailId && kmlFilenameMap[trailId]) {
      const baseUrl = getBaseUrl();
      const normalizedUrl = `${baseUrl}kml_normalized/${kmlFilenameMap[trailId]}`;
      console.log(`[KML Direct Override] Redirecting to normalized URL: ${normalizedUrl}`);
      return originalFetch(normalizedUrl, options);
    }
    
    // If we couldn't identify the trail, try a more generic approach
    if (url.includes('/kml/')) {
      // Extract just the filename from the path
      const urlParts = url.split('/');
      const filename = urlParts[urlParts.length - 1];
      
      // Remove spaces and special characters to create a normalized version
      const normalizedFilename = filename.replace(/\s+/g, '');
      
      const baseUrl = getBaseUrl();
      const normalizedUrl = `${baseUrl}kml_normalized/${normalizedFilename}`;
      console.log(`[KML Direct Override] Generic redirect to: ${normalizedUrl}`);
      return originalFetch(normalizedUrl, options);
    }
  }
  
  // For all other requests, use the original fetch
  return originalFetch(url, options);
};

// Function to filter out Point features (markers) from GeoJSON
function filterOutMarkers(geojson) {
  if (!geojson || !geojson.features) {
    return geojson;
  }
  
  // Keep only LineString and MultiLineString features (trails)
  geojson.features = geojson.features.filter(feature => {
    if (!feature.geometry) return false;
    
    // Keep only line features, filter out points (markers)
    return feature.geometry.type === 'LineString' || 
           feature.geometry.type === 'MultiLineString';
  });
  
  return geojson;
}

// Completely override the loadTrail function
window.originalLoadTrail = window.loadTrail;
window.loadTrail = async function(trailId) {
  console.log(`[KML Direct Override] Loading trail: ${trailId}`);
  
  try {
    // Get the trail object
    const trail = getTrailById(trailId);
    if (!trail) {
      console.error(`[KML Direct Override] Trail not found: ${trailId}`);
      return null;
    }
    
    // Check if we have a normalized filename for this trail
    if (kmlFilenameMap[trailId]) {
      const baseUrl = getBaseUrl();
      const normalizedUrl = `${baseUrl}kml_normalized/${kmlFilenameMap[trailId]}`;
      
      console.log(`[KML Direct Override] Using normalized URL: ${normalizedUrl}`);
      
      try {
        // Fetch the KML file
        const response = await fetch(normalizedUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status} for ${normalizedUrl}`);
        }
        
        // Get the KML content
        const kmlText = await response.text();
        
        // Convert KML to GeoJSON
        let geojson = toGeoJSON.kml(new DOMParser().parseFromString(kmlText, 'text/xml'));
        
        // Filter out markers (Point features)
        geojson = filterOutMarkers(geojson);
        
        // Create a GeoJSON layer
        const layer = L.geoJSON(geojson, {
          style: function(feature) {
            return { color: '#FF0000', weight: 3 };
          },
          // Don't create markers for points
          pointToLayer: function(feature, latlng) {
            // Return null to not display any markers
            return null;
          }
        });
        
        return layer;
      } catch (error) {
        console.error(`[KML Direct Override] Error loading trail ${trailId}:`, error);
        return null;
      }
    } else {
      // Fallback to original function if no mapping exists
      console.log(`[KML Direct Override] No mapping for ${trailId}, using original function`);
      return await window.originalLoadTrail(trailId);
    }
  } catch (error) {
    console.error(`[KML Direct Override] Error in loadTrail override:`, error);
    return null;
  }
};

// Also fix the service worker registration path
if ('serviceWorker' in navigator) {
  const baseUrl = getBaseUrl();
  
  // Unregister any existing service worker
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (let registration of registrations) {
      registration.unregister();
      console.log('[KML Direct Override] Unregistered existing service worker');
    }
    
    // Register the service worker with the correct path
    navigator.serviceWorker.register(`${baseUrl}service-worker.js`)
      .then(registration => {
        console.log('[KML Direct Override] Service Worker registered with scope:', registration.scope);
      })
      .catch(error => {
        console.error('[KML Direct Override] Service Worker registration failed:', error);
      });
  });
}

console.log('[KML Direct Override] Direct KML path override loaded and applied with marker removal');
