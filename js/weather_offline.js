// js/weather_offline.js
console.log("[WeatherOffline] weather_offline.js loaded.");

const NELSHOOGTE_LAT = -25.8530;
const NELSHOOGTE_LON = 30.7616;
const WEATHER_API_URL = `https://api.open-meteo.com/v1/forecast?latitude=${NELSHOOGTE_LAT}&longitude=${NELSHOOGTE_LON}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=7`;

// Dexie DB reference will be available globally as 'db'

async function fetchAndCacheWeatherData(isManualRefresh = false) {
    console.log("[WeatherOffline] Attempting to fetch and cache weather data...");
    const lastUpdatedDiv = document.getElementById("weather-last-updated");
    if (lastUpdatedDiv && !isManualRefresh) lastUpdatedDiv.textContent = "Fetching live weather data...";

    try {
        const response = await fetch(WEATHER_API_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("[WeatherOffline] Weather data fetched successfully:", data);

        if (data && data.daily) {
            const weatherEntry = {
                id: 1, 
                latitude: NELSHOOGTE_LAT,
                longitude: NELSHOOGTE_LON,
                forecastData: data, 
                lastFetchedTimestamp: Date.now()
            };
            await db.weather_cache.put(weatherEntry);
            console.log("[WeatherOffline] Weather data cached successfully.");
            await displayWeatherData(); // Refresh UI with new data
            return true;
        } else {
            console.error("[WeatherOffline] Fetched weather data is not in the expected format.", data);
            if (lastUpdatedDiv) lastUpdatedDiv.textContent = "Error: Invalid weather data format from server.";
            return false;
        }
    } catch (error) {
        console.error("[WeatherOffline] Error fetching or caching weather data:", error);
        if (lastUpdatedDiv) lastUpdatedDiv.textContent = "Error fetching live weather. Displaying cached data if available.";
        await displayWeatherData(); // Attempt to display from cache on error
        return false;
    }
}

async function getCachedWeatherData() {
    console.log("[WeatherOffline] Attempting to retrieve cached weather data...");
    try {
        const cachedWeather = await db.weather_cache.get(1);
        if (cachedWeather) {
            console.log("[WeatherOffline] Found cached weather data:", cachedWeather);
            return cachedWeather;
        } else {
            console.log("[WeatherOffline] No weather data found in cache.");
            return null;
        }
    } catch (error) {
        console.error("[WeatherOffline] Error retrieving cached weather data:", error);
        return null;
    }
}

function getWeatherDescriptionAndIcon(weatherCode) {
    const descriptions = {
        0: { text: "Clear sky", icon: "☀️" },
        1: { text: "Mainly clear", icon: "🌤️" },
        2: { text: "Partly cloudy", icon: "🌥️" },
        3: { text: "Overcast", icon: "☁️" },
        45: { text: "Fog", icon: "🌫️" },
        48: { text: "Depositing rime fog", icon: "🌫️" },
        51: { text: "Light drizzle", icon: "🌦️" },
        53: { text: "Moderate drizzle", icon: "🌦️" },
        55: { text: "Dense drizzle", icon: "🌦️" },
        61: { text: "Slight rain", icon: "🌧️" },
        63: { text: "Moderate rain", icon: "🌧️" },
        65: { text: "Heavy rain", icon: "🌧️" },
        80: { text: "Slight rain showers", icon: "🌦️" },
        81: { text: "Moderate rain showers", icon: "🌦️" },
        82: { text: "Violent rain showers", icon: "⛈️" },
        95: { text: "Thunderstorm", icon: "⛈️" }
    };
    return descriptions[weatherCode] || { text: "Unknown code: " + weatherCode, icon: "❓" };
}

function getHikingRecommendation(weatherCode, maxTemp, minTemp) {
    if (weatherCode === undefined || maxTemp === undefined || minTemp === undefined) {
        return "Weather data incomplete for recommendation.";
    }
    let advice = [];
    const code = Number(weatherCode);

    // Temperature-based advice
    if (maxTemp > 32) {
        advice.push("Extreme heat! Hike very early or very late. Carry extra water (at least 1L per hour per person). Watch for signs of heatstroke.");
    } else if (maxTemp > 28) {
        advice.push("Hot conditions. Start early, stay hydrated, and take frequent breaks in shade.");
    } else if (maxTemp < 5 || minTemp < 0) {
        advice.push("Freezing temperatures expected, especially at night/higher elevations. Pack warm layers, hat, gloves, and consider insulated water bottles.");
    } else if (minTemp < 5) {
        advice.push("Cold temperatures, especially in the morning/evening. Dress in layers.");
    }

    // Precipitation and conditions advice
    if ([61, 63, 65, 80, 81, 82].includes(code)) { // Rain categories
        advice.push("Rain expected. Pack full waterproof gear (jacket and pants). Trails may be slippery.");
    } else if ([51, 53, 55].includes(code)) { // Drizzle categories
        advice.push("Light drizzle possible. A waterproof jacket is recommended. Trails might become slippery.");
    }

    if (code === 95) { // Thunderstorm
        advice.push("Thunderstorms likely. Avoid exposed areas and high ridges. Check radar and be prepared to turn back or seek shelter. Start very early.");
    } else if (String(code).startsWith("9")) { // Other severe weather (e.g. 96, 99 - hail/squalls if API supports)
        advice.push("Potential for severe weather (thunderstorms with hail/squalls). Monitor conditions closely and be prepared to alter plans.");
    }

    if (code === 45 || code === 48) { // Fog
        advice.push("Fog expected, reducing visibility. Hike with caution, use GPS, and stay on marked trails.");
    }
    
    // Wind (if data were available, e.g., from a different API endpoint or parameter)
    // if (windSpeed > 30) { advice.push("Strong winds expected. Be careful on exposed ridges."); }

    // General conditions
    if (advice.length === 0) {
        if ([0, 1, 2].includes(code) && maxTemp > 10 && maxTemp <= 28) {
            advice.push("Generally good hiking conditions. Enjoy your hike!");
        } else {
            advice.push("Check detailed forecast and prepare accordingly for prevailing conditions.");
        }
    }

    return advice.join(" ");
}

async function displayWeatherData() {
    console.log("[WeatherOffline] Displaying weather data with per-day recommendations...");
    const forecastContainer = document.getElementById("weather-forecast-container");
    const lastUpdatedDiv = document.getElementById("weather-last-updated");
    // const recommendationDiv = document.getElementById("hiking-recommendation"); // No longer needed for general recommendation

    if (!forecastContainer || !lastUpdatedDiv) {
        console.error("[WeatherOffline] UI elements for weather display (forecast container or last updated) not found.");
        return;
    }

    forecastContainer.innerHTML = "<p>Loading weather forecast...</p>";
    // if (recommendationDiv) recommendationDiv.style.display = "none"; // Hide general recommendation div

    const cachedData = await getCachedWeatherData();

    if (cachedData && cachedData.forecastData && cachedData.forecastData.daily) {
        const daily = cachedData.forecastData.daily;
        const lastFetched = new Date(cachedData.lastFetchedTimestamp);
        lastUpdatedDiv.textContent = `Last updated: ${lastFetched.toLocaleString()}`;
        
        forecastContainer.innerHTML = ""; // Clear loading message

        for (let i = 0; i < daily.time.length; i++) {
            const dayData = {
                time: daily.time[i],
                weathercode: daily.weathercode[i],
                temperature_2m_max: daily.temperature_2m_max[i],
                temperature_2m_min: daily.temperature_2m_min[i]
            };
            const weatherInfo = getWeatherDescriptionAndIcon(dayData.weathercode);
            const dailyRecommendation = getHikingRecommendation(dayData.weathercode, dayData.temperature_2m_max, dayData.temperature_2m_min);
            const dayElement = document.createElement("div");
            dayElement.classList.add("weather-day-card");
            dayElement.innerHTML = `
                <h4>${new Date(dayData.time).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</h4>
                <div class="weather-icon" style="font-size: 2em;">${weatherInfo.icon}</div>
                <p>${weatherInfo.text}</p>
                <p>Max: ${dayData.temperature_2m_max}°C</p>
                <p>Min: ${dayData.temperature_2m_min}°C</p>
                <p class="daily-recommendation"><em>${dailyRecommendation}</em></p>
            `;
            forecastContainer.appendChild(dayElement);
        }
    } else {
        lastUpdatedDiv.textContent = "No cached weather data available.";
        forecastContainer.innerHTML = "<p>Could not load weather forecast. Please try refreshing when online.</p>";
        // if (recommendationDiv) recommendationDiv.textContent = "Weather data needed for recommendations.";
    }
}

async function initWeatherFeature() {
    console.log("[WeatherOffline] Initializing weather feature...");
    const refreshButton = document.getElementById("refresh-weather-btn");
    if (refreshButton) {
        refreshButton.addEventListener("click", () => {
            lastUpdatedDiv.textContent = "Refreshing weather data manually...";
            fetchAndCacheWeatherData(true);
        });
    }
    
    const lastUpdatedDiv = document.getElementById("weather-last-updated"); // Define for use in init

    // Attempt to fetch new data if online, otherwise display from cache.
    if (navigator.onLine) {
        await fetchAndCacheWeatherData();
    } else {
        if(lastUpdatedDiv) lastUpdatedDiv.textContent = "Offline. Displaying cached weather data.";
        await displayWeatherData(); // Display from cache if offline
    }
}

// Make functions globally available if they need to be called from app.js or HTML
window.initWeatherFeature = initWeatherFeature;
window.displayWeatherData = displayWeatherData; // Might be called by app.js when section becomes active

