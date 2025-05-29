// js/weather.js

// Sample weather data (replace with API call if available)
// NOTE: The structure assumes the first item is always "Today"
const sampleWeatherData = [
    { temp_high: 24, temp_low: 12, condition: "Sunny", icon: "☀️", recommendation: "Excellent hiking conditions!" },
    { temp_high: 23, temp_low: 11, condition: "Partly Cloudy", icon: "⛅", recommendation: "Great day for a hike." },
    { temp_high: 21, temp_low: 10, condition: "Cloudy", icon: "☁️", recommendation: "Cooler, but still good for hiking." },
    { temp_high: 22, temp_low: 13, condition: "Showers", icon: "🌦️", recommendation: "Possible rain, pack accordingly." },
    { temp_high: 25, temp_low: 14, condition: "Sunny", icon: "☀️", recommendation: "Warmer, stay hydrated." },
    { temp_high: 26, temp_low: 15, condition: "Sunny", icon: "☀️", recommendation: "Hot day, start early if possible." },
    { temp_high: 24, temp_low: 13, condition: "Partly Cloudy", icon: "⛅", recommendation: "Pleasant hiking weather." }
];

// Function to get formatted date string (e.g., "May 4")
function getFormattedDate(date) {
    const options = { month: "short", day: "numeric" };
    return date.toLocaleDateString("en-US", options);
}

// Function to display weather forecast
function displayWeatherForecast() {
    const forecastContainer = document.getElementById("weather-forecast");
    if (!forecastContainer) {
        console.error("[Weather] Weather forecast container not found!");
        return;
    }

    forecastContainer.innerHTML = ""; // Clear previous forecast

    const today = new Date();

    sampleWeatherData.forEach((dayData, index) => {
        const currentDate = new Date(today);
        currentDate.setDate(today.getDate() + index);

        const dateString = getFormattedDate(currentDate);
        const dayLabel = index === 0 ? "Today" : (index === 1 ? "Tomorrow" : dateString);

        const dayElement = document.createElement("div");
        dayElement.classList.add("weather-day");
        dayElement.innerHTML = `
            <h4>${dayLabel} (${dateString}) ${dayData.icon}</h4>
            <p>High: ${dayData.temp_high}°C | Low: ${dayData.temp_low}°C</p>
            <p>Condition: ${dayData.condition}</p>
            <p><em>Recommendation: ${dayData.recommendation}</em></p>
        `;
        forecastContainer.appendChild(dayElement);
    });
    console.log("[Weather] Weather forecast displayed with dates.");
}

// Initialize weather display when the section is shown (handled by app.js)
console.log("[Weather] weather.js loaded, displayWeatherForecast will be called by app.js");

