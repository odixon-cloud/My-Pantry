import { useEffect, useState } from "react";

const WEATHER_REFRESH_INTERVAL = 30 * 60 * 1000;
const PENSACOLA_WEATHER_URL =
  "https://api.open-meteo.com/v1/forecast?latitude=30.42&longitude=-87.22&current=temperature_2m,weather_code&temperature_unit=fahrenheit";

function getWeatherDetails(code) {
  if (code === 0) return { label: "Sunny", icon: "☀️" };
  if (code === 1) return { label: "Mostly Sunny", icon: "🌤️" };
  if (code === 2) return { label: "Partly Cloudy", icon: "⛅" };
  if (code === 3) return { label: "Cloudy", icon: "☁️" };
  if (code === 45 || code === 48) return { label: "Fog", icon: "🌫️" };
  if ([51, 53, 55].includes(code)) return { label: "Drizzle", icon: "🌦️" };
  if ([56, 57, 66, 67, 71, 73, 75, 77, 85, 86].includes(code)) {
    return { label: "Snow / Ice", icon: "❄️" };
  }
  if ([61, 63, 80, 81].includes(code)) return { label: "Rain", icon: "🌧️" };
  if (code === 65 || code === 82) return { label: "Heavy Rain", icon: "🌧️" };
  if ([95, 96, 99].includes(code)) return { label: "Thunderstorms", icon: "⛈️" };

  return { label: "Unknown", icon: "🌡️" };
}

function KitchenStatus() {
  const [now, setNow] = useState(() => new Date());
  const [weather, setWeather] = useState(null);
  const [weatherState, setWeatherState] = useState("loading");

  useEffect(() => {
    const clockTimer = window.setInterval(() => setNow(new Date()), 60 * 1000);

    return () => window.clearInterval(clockTimer);
  }, []);

  useEffect(() => {
    let isActive = true;
    let requestController;

    async function loadWeather() {
      requestController?.abort();
      requestController = new AbortController();

      try {
        const response = await fetch(PENSACOLA_WEATHER_URL, {
          signal: requestController.signal,
        });

        if (!response.ok) {
          throw new Error("Weather request failed.");
        }

        const data = await response.json();
        const temperature = Number(data.current?.temperature_2m);
        const weatherCode = Number(data.current?.weather_code);

        if (!Number.isFinite(temperature) || !Number.isFinite(weatherCode)) {
          throw new Error("Weather response was incomplete.");
        }

        if (isActive) {
          setWeather({ temperature, weatherCode });
          setWeatherState("ready");
        }
      } catch (error) {
        if (isActive && error.name !== "AbortError") {
          setWeather(null);
          setWeatherState("error");
        }
      }
    }

    loadWeather();
    const weatherTimer = window.setInterval(
      loadWeather,
      WEATHER_REFRESH_INTERVAL
    );

    return () => {
      isActive = false;
      window.clearInterval(weatherTimer);
      requestController?.abort();
    };
  }, []);

  const formattedTime = now.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const formattedDate = now.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const weatherDetails = weather
    ? getWeatherDetails(weather.weatherCode)
    : null;

  return (
    <section className="kitchen-status" aria-label="Current date, time, and Pensacola weather">
      <div className="kitchen-clock">
        <time className="kitchen-time" dateTime={now.toISOString()}>
          {formattedTime}
        </time>
        <span className="kitchen-date">{formattedDate}</span>
      </div>

      <div className="kitchen-weather" aria-live="polite">
        {weatherState === "loading" && (
          <span className="weather-message">Loading weather…</span>
        )}
        {weatherState === "error" && (
          <span className="weather-message">Weather unavailable</span>
        )}
        {weatherState === "ready" && weatherDetails && (
          <>
            <span className="weather-icon" role="img" aria-label={weatherDetails.label}>
              {weatherDetails.icon}
            </span>
            <span className="weather-reading">
              <strong>{Math.round(weather.temperature)}°F</strong>
              <span>{weatherDetails.label}</span>
            </span>
          </>
        )}
      </div>
    </section>
  );
}

export default KitchenStatus;
