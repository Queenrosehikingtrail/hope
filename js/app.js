// js/app.js
window.isSavingWaypointGlobalFlag = false; // TRUE WINDOW-LEVEL GLOBAL
let appMainInitialized = false; // Flag for the main DOMContentLoaded block

// Define the waypoint click handler function
async function handleWaypointSaveClick() {
    console.log("[App] Waypoint button clicked! (handleWaypointSaveClick) LOG 1");
    console.log(`[App] Current window.isSavingWaypointGlobalFlag state (at entry): ${window.isSavingWaypointGlobalFlag}. LOG 1.1`);

    if (window.isSavingWaypointGlobalFlag) {
        console.log("[App] window.isSavingWaypointGlobalFlag is true. Exiting. LOG 2");
        return;
    }
    
    const waypointButton = document.getElementById("add-waypoint-btn-ui"); // Get button inside handler
    if (!waypointButton) {
        console.error("[App] Waypoint button not found inside handler. LOG 2.1");
        window.isSavingWaypointGlobalFlag = false; 
        return;
    }

    console.log("[App] Setting window.isSavingWaypointGlobalFlag and disabling button. LOG 3");
    window.isSavingWaypointGlobalFlag = true;
    waypointButton.disabled = true;
    const originalButtonText = waypointButton.textContent;
    waypointButton.textContent = "Saving...";

    try {
        console.log("[App] Inside try block. Checking saveNewWaypoint function. LOG 4");
        if (typeof saveNewWaypoint === "function") {
            console.log("[App] saveNewWaypoint IS defined. Checking geolocation API. LOG 5");
            if (navigator.geolocation) {
                console.log("[App] Geolocation API IS available. Awaiting current position... LOG 6");
                
                const position = await new Promise((resolve, reject) => {
                    console.log("[App] Geolocation Promise executor started. LOG 6.1");
                    navigator.geolocation.getCurrentPosition(
                        (pos) => { console.log("[App] Geolocation success callback. LOG 6.2"); resolve(pos); },
                        (err) => { console.log("[App] Geolocation error callback. LOG 6.3"); reject(err); },
                        { timeout: 15000, enableHighAccuracy: true, maximumAge: 0 }
                    );
                });
                console.log("[App] Geolocation position obtained. Proceeding. LOG 7");

                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                console.log(`[App] Lat: ${lat}, Lon: ${lon}. Awaiting saveNewWaypoint... LOG 8`);
                await saveNewWaypoint(lat, lon);
                console.log("[App] saveNewWaypoint call completed. LOG 9");
            } else {
                console.error("[App] Geolocation NOT supported. LOG 10");
                alert("Geolocation is not supported by this browser.");
            }
        } else {
            console.error("[App] saveNewWaypoint IS NOT defined. LOG 11");
            alert("Waypoint functionality unavailable: saveNewWaypoint not found.");
        }
    } catch (error) {
        console.error("[App] CAUGHT ERROR in try block: LOG 12", error);
        if (error && typeof error.code === "number" && error.message) { // Check if it's a GeolocationPositionError
            alert(`Could not get current location: ${error.message}.`);
        }
    } finally {
        console.log("[App] ENTERING FINALLY BLOCK. LOG 13");
        window.isSavingWaypointGlobalFlag = false;
        const finalWaypointButton = document.getElementById("add-waypoint-btn-ui"); 
        if (finalWaypointButton) {
            finalWaypointButton.disabled = false;
            finalWaypointButton.textContent = originalButtonText;
        } else {
            console.warn("[App] Waypoint button not found in finally block. LOG 13.1");
        }
        console.log("[App] EXITING FINALLY BLOCK. Button re-enabled, window.isSavingWaypointGlobalFlag cleared. LOG 14");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    if (appMainInitialized) {
        console.warn("[App] Main DOMContentLoaded handler already run. Skipping re-initialization.");
        return;
    }
    appMainInitialized = true;
    console.log("[App] Main DOMContentLoaded handler running for the first time.");

    // Initialize Dexie DB
    const db = new Dexie("QueenRoseDB");
    db.version(1).stores({
        weather_cache: "id", // Primary key 'id'
        kml_files: "++id, name, lastModified", // Auto-incrementing primary key, index on name
        gpx_tracks: "++id, name, timestamp", // Auto-incrementing primary key for tracks
        waypoints: "++id, name, lat, lon, timestamp" // Auto-incrementing primary key for waypoints
    });
    window.db = db; // Make db globally accessible
    console.log("[App] Dexie DB initialized.");

    const navButtons = document.querySelectorAll("nav button");
    const sections = document.querySelectorAll(".app-section");
    const versionIndicator = document.getElementById("version-indicator");

    if (versionIndicator) {
        versionIndicator.textContent = `Version: ${new Date().toISOString()}`;
    }

    window.switchSection = (sectionId) => {
        console.log(`[App] Switching to section: ${sectionId}`);
        sections.forEach(section => section.classList.remove("active"));
        navButtons.forEach(button => button.classList.remove("active"));
        const activeSection = document.getElementById(`${sectionId}-section`);
        const activeButton = document.querySelector(`nav button[data-section="${sectionId}"]`);
        if (activeSection) activeSection.classList.add("active");
        else console.error(`[App] Section with ID ${sectionId}-section not found!`);
        if (activeButton) activeButton.classList.add("active");
        if (sectionId === "map" && typeof map !== "undefined" && map) map.invalidateSize();
        if (sectionId === "weather" && typeof initWeatherFeature === "function") {
            console.log("[App] Initializing weather feature...");
            initWeatherFeature(); // This function in weather_offline.js handles fetching and displaying
        }
        if (sectionId === "my-kmls" && typeof initKMLManagement === "function") initKMLManagement();
        if (sectionId === "my-waypoints" && typeof loadAndDisplaySavedWaypoints === "function") loadAndDisplaySavedWaypoints();
    };

    navButtons.forEach(button => {
        button.addEventListener("click", () => {
            const sectionId = button.getAttribute("data-section");
            if (sectionId) switchSection(sectionId);
            else console.warn("[App] Button clicked without data-section attribute:", button);
        });
    });

    const kmlListContainer = document.getElementById("kml-file-list");
    if (kmlListContainer && typeof getAllTrails === "function") {
        const trails = getAllTrails();
        kmlListContainer.innerHTML = "";
        trails.forEach(trail => {
            if (!trail.id || !trail.name) return;
            const listItem = document.createElement("li");
            const link = document.createElement("a");
            link.href = "#";
            link.textContent = `${trail.name} (${trail.distance || 'N/A'} km)`;
            link.dataset.trailId = trail.id;
            link.addEventListener("click", (event) => {
                event.preventDefault();
                const selectedTrailId = event.target.dataset.trailId;
                switchSection("map");
                const trailSelectDropdown = document.getElementById("trail-select");
                if (trailSelectDropdown) trailSelectDropdown.value = selectedTrailId;
                if (typeof displayTrail === "function") displayTrail(selectedTrailId);
                else console.error("[App] displayTrail function not found!");
            });
            listItem.appendChild(link);
            kmlListContainer.appendChild(listItem);
        });
    }

    const trailDetailsContainer = document.getElementById("trail-details");
    if (trailDetailsContainer && typeof getAllTrails === "function") {
        const trails = getAllTrails();
        trailDetailsContainer.innerHTML = "";
        trails.forEach(trail => {
            const item = document.createElement("div");
            item.classList.add("trail-item");
            item.innerHTML = `<h3>${trail.name}</h3>
                ${trail.elevationImage ? `<img src="img/elevation/${trail.elevationImage}" alt="${trail.name} Elevation Profile" style="max-width: 100%; height: auto; margin-top: 10px; margin-bottom: 10px;">` : ''}
                <p><strong>Type:</strong> ${trail.type || 'N/A'}</p>
                <p>${trail.description || 'No description available.'}</p>
                <button onclick="viewTrailOnMap('${trail.id}')">View on Map</button>`;
            trailDetailsContainer.appendChild(item);
        });
    }

    window.viewTrailOnMap = (trailId) => {
        if (trailId && typeof displayTrail === "function") {
            const trailSelect = document.getElementById("trail-select");
            if(trailSelect) trailSelect.value = trailId;
            displayTrail(trailId);
            switchSection("map");
        } else console.error(`[App] Invalid trailId (${trailId}) or displayTrail function not found.`);
    }

    const trailSelectBooking = document.getElementById("booking-trail");
    if (trailSelectBooking && typeof getAllTrails === "function") {
        const trails = getAllTrails();
        trailSelectBooking.innerHTML = "";
        const placeholderOption = document.createElement("option");
        placeholderOption.value = ""; placeholderOption.disabled = true; placeholderOption.selected = true;
        placeholderOption.textContent = "-- Select a Trail --";
        trailSelectBooking.appendChild(placeholderOption);
        trails.forEach(trail => {
            const option = document.createElement("option");
            option.value = trail.id; option.textContent = trail.name;
            trailSelectBooking.appendChild(option);
        });
    }

    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("/service-worker.js")
            .then(reg => console.log("[App] Service Worker registered with scope:", reg.scope))
            .catch(err => console.error("[App] Service Worker registration failed:", err));
    }

    // --- Waypoint Button Event Listener --- START ---
    const waypointButton = document.getElementById("add-waypoint-btn-ui");
    if (waypointButton) {
        console.log("[App] Waypoint button (add-waypoint-btn-ui) found. Assigning click handler.");
        waypointButton.onclick = handleWaypointSaveClick; // Assign the named function
        console.log("[App] Assigned handleWaypointSaveClick to waypoint button onclick.");
    } else {
        console.error("[App] Waypoint button (add-waypoint-btn-ui) NOT found in the DOM during main setup!");
    }
    // --- Waypoint Button Event Listener --- END ---

    switchSection("map");
    console.log("[App] Main DOMContentLoaded setup complete.");
});

// Other DOMContentLoaded listeners for Splide and Hamburger menu remain separate
document.addEventListener("DOMContentLoaded", () => {
    const galleries = document.querySelectorAll(".accommodation-gallery");
    if (galleries.length > 0 && typeof Splide !== "undefined") {
        galleries.forEach((gallery, index) => {
            try {
                new Splide(gallery, {
                    type: 'loop', perPage: 3, perMove: 1, gap: '1rem', pagination: false,
                    breakpoints: { 768: { perPage: 1 } }
                }).mount();
            } catch (error) {
                console.error(`[App] Error initializing Splide for gallery ${index + 1}:`, error);
            }
        });
    } else if (typeof Splide === "undefined") console.error("[App] Splide library not found.");
});

document.addEventListener("DOMContentLoaded", () => {
    const hamburgerMenu = document.getElementById("hamburger-menu");
    const slideOutMenu = document.getElementById("slide-out-menu");
    const mainContent = document.getElementById("app-content");
    if (hamburgerMenu && slideOutMenu) {
        hamburgerMenu.addEventListener("click", () => {
            slideOutMenu.classList.toggle("open");
            document.body.classList.toggle("menu-open"); 
        });
        slideOutMenu.querySelectorAll("button").forEach(button => {
            button.addEventListener("click", () => {
                const sectionId = button.getAttribute("data-section");
                if (sectionId) {
                    if (typeof switchSection === "function") switchSection(sectionId);
                    slideOutMenu.classList.remove("open");
                    document.body.classList.remove("menu-open");
                }
            });
        });
        mainContent.addEventListener("click", (event) => {
            if (slideOutMenu.classList.contains("open") && !slideOutMenu.contains(event.target) && !hamburgerMenu.contains(event.target)) {
                slideOutMenu.classList.remove("open");
                document.body.classList.remove("menu-open");
            }
        });
    } else console.error("[App] Hamburger menu or slide-out menu element not found.");
});

function getTrailById(trailId) {
    if (typeof trailsData !== 'undefined') return trailsData.find(trail => trail.id === trailId);
    console.error("[App] trailsData is not defined!"); return null;
}

function getAllTrails() {
    if (typeof trailsData !== 'undefined') return trailsData;
    console.error("[App] trailsData is not defined!"); return [];
}

