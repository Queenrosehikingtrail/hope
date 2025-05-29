// js/gps_tracking.js

console.log("[GPSTracking] gps_tracking.js loaded (v2 - with fixes).");

// Initialize Dexie database for GPS tracks
const db = new Dexie("QueenRoseAppDB");
db.version(4).stores({
    recorded_tracks: "++id, name, startTime",
    user_kml_files: "++id, name, originalFileName, addedTimestamp",
    weather_cache: "id",
    waypoints: "++id, name, timestamp" // Added waypoints store
});

console.log("[GPSTracking] Dexie DB version 4 configured with recorded_tracks, user_kml_files, weather_cache, and waypoints stores.");

// --- DOM Elements ---
let startRecordingBtn, pauseRecordingBtn, resumeRecordingBtn, stopRecordingBtn, recordingStatusSpan;
let recordedTracksListContainer; // Renamed from tracksListContainer for clarity

// --- Core Recording Logic ---
let isRecording = false;
let isPaused = false;
let currentTrackPoints = [];
let watchId = null;
let currentTrackStartTime = null;
let currentTrackName = null; // Added to store the name generated at start
let currentMapTrackLayer = null; // To hold the Leaflet layer for the currently recording track
let displayedSavedTrackLayer = null; // To hold the Leaflet layer for a displayed saved track

function initGPSTrackingControls() {
    console.log("[GPSTracking - initControls] Attempting to initialize GPS tracking controls.");
    try {
        startRecordingBtn = document.getElementById("start-recording-btn");
        pauseRecordingBtn = document.getElementById("pause-recording-btn");
        resumeRecordingBtn = document.getElementById("resume-recording-btn");
        stopRecordingBtn = document.getElementById("stop-recording-btn");
        recordingStatusSpan = document.getElementById("recording-status");
        recordedTracksListContainer = document.getElementById("recorded-tracks-list-container"); // Corrected ID from previous plan

        if (!startRecordingBtn || !pauseRecordingBtn || !resumeRecordingBtn || !stopRecordingBtn || !recordingStatusSpan) {
            console.error("[GPSTracking - initControls] One or more GPS control buttons or status span not found in the DOM.");
            // Not returning, as track listing might still work if container is present
        }
        if (!recordedTracksListContainer) {
            console.warn("[GPSTracking - initControls] Recorded tracks list container not found.");
        }

        if (startRecordingBtn) {
            startRecordingBtn.addEventListener("click", startRecording);
            console.log("[GPSTracking - initControls] Event listener added to Start Recording button.");
        } else {
            console.error("[GPSTracking - initControls] Start Recording button not found! Cannot add listener.");
        }
        if (pauseRecordingBtn) pauseRecordingBtn.addEventListener("click", pauseRecording);
        if (resumeRecordingBtn) resumeRecordingBtn.addEventListener("click", resumeRecording);
        if (stopRecordingBtn) stopRecordingBtn.addEventListener("click", stopRecording);

        if (navigator.geolocation && startRecordingBtn) {
            startRecordingBtn.style.display = "inline-block";
        } else {
            if (!navigator.geolocation) console.warn("[GPSTracking - initControls] Geolocation is not available in this browser.");
            if(recordingStatusSpan) recordingStatusSpan.textContent = "GPS not available";
            if(startRecordingBtn) startRecordingBtn.style.display = "none";
        }
        updateRecordingButtons();
        loadAndDisplaySavedTracks(); 
        console.log("[GPSTracking - initControls] GPS tracking controls initialization attempt finished.");
    } catch (e) {
        console.error("[GPSTracking - initControls] CRITICAL ERROR during control initialization:", e);
        alert("A critical error occurred setting up GPS tracking. Please check console.");
    }
}

function updateRecordingButtons() {
    if (!startRecordingBtn || !pauseRecordingBtn || !resumeRecordingBtn || !stopRecordingBtn || !recordingStatusSpan) {
        // console.warn("[GPSTracking - updateButtons] One or more control buttons not found. Skipping update.");
        return;
    }

    if (!isRecording) {
        startRecordingBtn.style.display = (navigator.geolocation) ? "inline-block" : "none";
        pauseRecordingBtn.style.display = "none";
        resumeRecordingBtn.style.display = "none";
        stopRecordingBtn.style.display = "none";
        recordingStatusSpan.style.display = "none";
    } else {
        startRecordingBtn.style.display = "none";
        stopRecordingBtn.style.display = "inline-block";
        recordingStatusSpan.style.display = "inline-block";
        if (isPaused) {
            pauseRecordingBtn.style.display = "none";
            resumeRecordingBtn.style.display = "inline-block";
            recordingStatusSpan.textContent = "Paused";
        } else {
            pauseRecordingBtn.style.display = "inline-block";
            resumeRecordingBtn.style.display = "none";
            recordingStatusSpan.textContent = "Recording...";
        }
    }
}

function startRecording() {
    console.log("[GPSTracking - startRecording] Function called.");
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser or permission was denied.");
        console.error("[GPSTracking - startRecording] Geolocation not supported or denied.");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (initialPosition) => {
            console.log("[GPSTracking - startRecording] Geolocation permission granted. Starting recording.");
            isRecording = true;
            isPaused = false;
            currentTrackPoints = [];
            currentTrackStartTime = Date.now();
            currentTrackName = `Track ${new Date(currentTrackStartTime).toLocaleString().replace(/[/:]/g, "-")}`;
            console.log("[GPSTracking - startRecording] Starting new track recording:", currentTrackName);

            const geoOptions = {
                enableHighAccuracy: true,
                timeout: 20000, 
                maximumAge: 0 
            };

            watchId = navigator.geolocation.watchPosition(
                handlePositionUpdate,
                handlePositionError,
                geoOptions
            );

            updateRecordingButtons();
            if (typeof map !== "undefined" && map && typeof L !== "undefined") {
                if (currentMapTrackLayer) map.removeLayer(currentMapTrackLayer);
                currentMapTrackLayer = L.polyline([], { color: "yellow", weight: 3, opacity: 0.8 }).addTo(map);
                console.log("[GPSTracking - startRecording] Added new polyline to map for current track.");
            }
        },
        (error) => {
            handlePositionError(error); // Reuse error handler
            alert("Could not start GPS tracking. Please ensure location services are enabled and permission is granted for this site.");
            console.error("[GPSTracking - startRecording] Error in getCurrentPosition:", error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
}

function handlePositionUpdate(position) {
    if (!isRecording || isPaused) return;
    const { latitude, longitude, altitude, accuracy, speed, heading } = position.coords;
    const timestamp = position.timestamp || Date.now();

    // Accuracy Improvement: Filter out points with poor accuracy.
    const ACCURACY_THRESHOLD = 15; // meters - User requested more accuracy, 15m is a stricter threshold.

    if (accuracy > ACCURACY_THRESHOLD) {
        console.warn(`[GPSTracking - handlePositionUpdate] Position discarded due to low accuracy: ${accuracy}m (threshold: ${ACCURACY_THRESHOLD}m)`);
        return; // Skip this point
    }

    console.log(`[GPSTracking - handlePositionUpdate] Position update (Accuracy: ${accuracy}m): Lat: ${latitude}, Lng: ${longitude}`);
    const newPoint = { lat: latitude, lng: longitude, alt: altitude, acc: accuracy, spd: speed, hdg: heading, ts: timestamp };
    currentTrackPoints.push(newPoint);
    if (currentMapTrackLayer) {
        currentMapTrackLayer.addLatLng([latitude, longitude]);
    }
}

function handlePositionError(error) {
    console.error(`[GPSTracking - handlePositionError] Code: ${error.code}, Message: ${error.message}`);
    if(recordingStatusSpan) recordingStatusSpan.textContent = `GPS Error: ${error.message}`;
    if (error.code === 1) { // PERMISSION_DENIED
        alert("Geolocation permission denied. Please enable location services for this app in your browser/OS settings.");
        if(isRecording) stopRecording(false); // Stop without saving if permission revoked mid-way
        updateRecordingButtons();
    }
}

function pauseRecording() {
    if (!isRecording || isPaused) return;
    isPaused = true;
    console.log("[GPSTracking - pauseRecording] Recording paused.");
    updateRecordingButtons();
}

function resumeRecording() {
    if (!isRecording || !isPaused) return;
    isPaused = false;
    console.log("[GPSTracking - resumeRecording] Recording resumed.");
    updateRecordingButtons();
}

async function stopRecording(saveTrack = true) {
    if (!isRecording) return;
    console.log("[GPSTracking - stopRecording] Stopping recording.");
    if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    watchId = null;
    isRecording = false;
    isPaused = false;

    if (saveTrack && currentTrackPoints.length > 1) { // Need at least 2 points for a track
        const trackToSave = {
            name: currentTrackName,
            startTime: currentTrackStartTime,
            endTime: Date.now(),
            points: currentTrackPoints,
            distance: calculateTotalDistance(currentTrackPoints)
        };
        try {
            const id = await db.recorded_tracks.add(trackToSave);
            console.log(`[GPSTracking - stopRecording] Track "${trackToSave.name}" saved with ID: ${id}`);
            alert(`Track "${trackToSave.name}" saved successfully!`);
            loadAndDisplaySavedTracks(); // Refresh the list
        } catch (error) {
            console.error("[GPSTracking - stopRecording] Error saving track to IndexedDB:", error);
            alert("Error saving track. Please check console for details.");
        }
    } else if (saveTrack) {
        console.log("[GPSTracking - stopRecording] Not enough points recorded, track not saved.");
        alert("Track not saved: not enough points recorded.");
    } else {
        console.log("[GPSTracking - stopRecording] Track not saved as requested (e.g., discarded).");
    }

    currentTrackPoints = [];
    currentTrackStartTime = null;
    // currentTrackName = null; // Keep name for potential immediate re-save if needed? No, reset.
    currentTrackName = null;
    updateRecordingButtons();
}

async function loadAndDisplaySavedTracks() {
    if (!recordedTracksListContainer) {
        // console.warn("[GPSTracking - loadTracks] Recorded tracks list container not found. Cannot display tracks.");
        return;
    }
    try {
        const tracks = await db.recorded_tracks.orderBy("startTime").reverse().toArray();
        recordedTracksListContainer.innerHTML = ""; 
        if (tracks.length === 0) {
            recordedTracksListContainer.innerHTML = "<p>No tracks recorded yet.</p>";
            return;
        }
        const ul = document.createElement("ul");
        tracks.forEach(track => {
            const li = document.createElement("li");
            const duration = track.endTime ? formatDuration(track.endTime - track.startTime) : "N/A";
            const distanceKm = track.distance ? (track.distance / 1000).toFixed(2) : "N/A";
            li.innerHTML = `
                <strong>${escapeXml(track.name)}</strong><br>
                <small>Date: ${new Date(track.startTime).toLocaleDateString()}</small><br>
                <small>Duration: ${duration}</small><br>
                <small>Distance: ${distanceKm} km</small><br>
                <button class="view-track-btn" data-track-id="${track.id}">View on Map</button>
                <button class="export-track-btn" data-track-id="${track.id}">Export GPX</button>
                <button class="delete-track-btn" data-track-id="${track.id}">Delete</button>
            `;
            ul.appendChild(li);
        });
        recordedTracksListContainer.appendChild(ul);

        document.querySelectorAll(".view-track-btn").forEach(btn => btn.addEventListener("click", handleViewTrack));
        document.querySelectorAll(".delete-track-btn").forEach(btn => btn.addEventListener("click", handleDeleteTrack));
        document.querySelectorAll(".export-track-btn").forEach(btn => btn.addEventListener("click", handleExportTrack));

    } catch (error) {
        console.error("[GPSTracking - loadTracks] Error loading tracks from IndexedDB:", error);
        if(recordedTracksListContainer) recordedTracksListContainer.innerHTML = "<p>Error loading tracks.</p>";
    }
}

async function handleViewTrack(event) {
    const trackId = parseInt(event.target.dataset.trackId);
    if (isNaN(trackId)) return;
    try {
        const track = await db.recorded_tracks.get(trackId);
        if (track && track.points && typeof map !== "undefined" && map && typeof L !== "undefined") {
            if (displayedSavedTrackLayer) map.removeLayer(displayedSavedTrackLayer);
            const latLngs = track.points.map(p => [p.lat, p.lng]);
            displayedSavedTrackLayer = L.polyline(latLngs, { color: "blue", weight: 4, opacity: 0.7 }).addTo(map);
            if (latLngs.length > 0) map.fitBounds(displayedSavedTrackLayer.getBounds());
            console.log(`[GPSTracking - viewTrack] Displaying track ID ${trackId} on map.`);
            if (typeof window.switchSection === "function") window.switchSection("map");
        } else {
            alert("Could not load track data to display.");
        }
    } catch (error) {
        console.error("[GPSTracking - viewTrack] Error fetching track for viewing:", error);
        alert("Error displaying track.");
    }
}

async function handleDeleteTrack(event) {
    const trackId = parseInt(event.target.dataset.trackId);
    if (isNaN(trackId)) return;
    try {
        const track = await db.recorded_tracks.get(trackId); // Get name before deleting
        if (!track) {
            alert("Track not found for deletion.");
            return;
        }
        if (confirm(`Are you sure you want to delete the track "${escapeXml(track.name)}"?`)) {
            await db.recorded_tracks.delete(trackId);
            console.log(`[GPSTracking - deleteTrack] Deleted track ID ${trackId}.`);
            alert("Track deleted successfully.");
            // Check if the deleted track was the one being displayed
            if (displayedSavedTrackLayer && displayedSavedTrackLayer.options && displayedSavedTrackLayer.options.trackId === trackId) { 
                map.removeLayer(displayedSavedTrackLayer);
                displayedSavedTrackLayer = null;
            }
            loadAndDisplaySavedTracks(); // Refresh list
        }
    } catch (error) {
        console.error("[GPSTracking - deleteTrack] Error deleting track:", error);
        alert("Error deleting track.");
    }
}

async function handleExportTrack(event) {
    const trackId = parseInt(event.target.dataset.trackId);
    if (isNaN(trackId)) return;
    try {
        const track = await db.recorded_tracks.get(trackId);
        if (track && track.points) {
            const gpxData = convertToGPX(track);
            const filename = `${track.name.replace(/[^a-z0-9_\-]/gi, "_")}.gpx`;
            downloadGPX(gpxData, filename);
            console.log(`[GPSTracking - exportTrack] Exported track ID ${trackId} as ${filename}.`);
        } else {
            alert("Could not load track data for export.");
        }
    } catch (error) {
        console.error("[GPSTracking - exportTrack] Error fetching track for export:", error);
        alert("Error exporting track.");
    }
}

function convertToGPX(track) {
    let gpx = 
`<?xml version="1.0" encoding="UTF-8" standalone="no" ?>
<gpx xmlns="http://www.topografix.com/GPX/1/1" xmlns:gpxx="http://www.garmin.com/xmlschemas/GpxExtensions/v3" xmlns:gpxtpx="http://www.garmin.com/xmlschemas/TrackPointExtension/v1" creator="QueenRoseHikingApp" version="1.1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd http://www.garmin.com/xmlschemas/GpxExtensions/v3 http://www.garmin.com/xmlschemas/GpxExtensionsv3.xsd http://www.garmin.com/xmlschemas/TrackPointExtension/v1 http://www.garmin.com/xmlschemas/TrackPointExtensionv1.xsd">
  <metadata>
    <name>${escapeXml(track.name)}</name>
    <time>${new Date(track.startTime).toISOString()}</time>
  </metadata>
  <trk>
    <name>${escapeXml(track.name)}</name>
    <trkseg>
`;

    track.points.forEach(p => {
        gpx += `      <trkpt lat="${p.lat}" lon="${p.lng}">
`;
        if (p.alt !== null && p.alt !== undefined) { // Corrected check for altitude
            gpx += `        <ele>${p.alt}</ele>
`;
        }
        if (p.ts !== null && p.ts !== undefined) {
            gpx += `        <time>${new Date(p.ts).toISOString()}</time>
`;
        }
        gpx += `      </trkpt>
`;
    });

    gpx += 
`    </trkseg>
  </trk>
</gpx>`;
    return gpx;
}

function escapeXml(unsafe) {
    if (unsafe === null || unsafe === undefined) return "";
    return unsafe.toString().replace(/[<>&'"]/g, function (c) {
        switch (c) {
            case "<": return "&lt;";
            case ">": return "&gt;";
            case "&": return "&amp;";
            case "'": return "&apos;";
            case "\"": return "&quot;";
            default: return c; // Should not happen with the regex
        }
    });
}

function downloadGPX(data, filename) {
    const blob = new Blob([data], { type: "application/gpx+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function formatDuration(ms) {
    let seconds = Math.floor(ms / 1000);
    let minutes = Math.floor(seconds / 60);
    let hours = Math.floor(minutes / 60);
    seconds = seconds % 60;
    minutes = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function calculateTotalDistance(points) {
    let totalDistance = 0;
    if (points.length < 2) return 0;
    for (let i = 0; i < points.length - 1; i++) {
        totalDistance += haversineDistance(points[i], points[i+1]);
    }
    return totalDistance; 
}

function haversineDistance(coords1, coords2) {
    function toRad(x) { return x * Math.PI / 180; }
    const R = 6371e3; 
    const dLat = toRad(coords2.lat - coords1.lat);
    const dLon = toRad(coords2.lng - coords1.lng);
    const lat1 = toRad(coords1.lat);
    const lat2 = toRad(coords2.lat);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Ensure this is called after the DOM is fully loaded
if (document.readyState === "loading") {  // Loading hasn't finished yet
    document.addEventListener("DOMContentLoaded", initGPSTrackingControls);
} else {  // `DOMContentLoaded` has already fired
    initGPSTrackingControls();
}

// Expose functions to be called from app.js or other modules if needed
window.gpsTracking = {
    loadAndDisplaySavedTracks,
    initGPSTrackingControls // Expose for potential re-init if needed
};

console.log("[GPSTracking] gps_tracking.js script evaluation complete (v2 - with fixes).");

