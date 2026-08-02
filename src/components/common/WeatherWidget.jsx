import { useEffect, useState, memo } from "react";
import { FiMapPin, FiAlertCircle } from "react-icons/fi";
import {
  WiDaySunny,
  WiCloud,
  WiCloudy,
  WiRain,
  WiThunderstorm,
  WiSnow,
  WiFog,
} from "react-icons/wi";

/**
 * WeatherWidget
 * Compact current-weather card. Uses the browser Geolocation API to find
 * the user's coordinates, then queries OpenWeatherMap's current-weather
 * endpoint (VITE_WEATHER_API_URL/_KEY). Degrades gracefully: if geolocation
 * is denied/unavailable or the API key isn't configured, it renders a
 * quiet placeholder rather than an alarming error — weather is a nice-to-have,
 * not core functionality.
 *
 * Kept as a self-contained fetch (like summarizeArticle) rather than added
 * to services/newsApi.js: it's a completely different provider/contract,
 * and the locked services/ folder only defines axios.js + newsApi.js for
 * the news API specifically.
 */
function WeatherWidget() {
  const [status, setStatus] = useState("loading"); // loading | ready | denied | error | unconfigured
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_WEATHER_API_KEY;
    const apiUrl = import.meta.env.VITE_WEATHER_API_URL;

    if (!apiKey || !apiUrl || apiKey === "your_weather_api_key_here") {
      setStatus("unconfigured");
      return;
    }

    if (!navigator.geolocation) {
      setStatus("error");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(
            `${apiUrl}/weather?lat=${coords.latitude}&lon=${coords.longitude}&units=metric&appid=${apiKey}`
          );
          if (!res.ok) throw new Error("Weather request failed");
          const data = await res.json();
          setWeather({
            temp: Math.round(data.main.temp),
            feelsLike: Math.round(data.main.feels_like),
            condition: data.weather?.[0]?.main || "Clear",
            description: data.weather?.[0]?.description || "",
            city: data.name,
            country: data.sys?.country,
          });
          setStatus("ready");
        } catch {
          setStatus("error");
        }
      },
      () => setStatus("denied"),
      { timeout: 8000 }
    );
  }, []);

  if (status === "unconfigured") return null;

  if (status === "loading") {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-card dark:bg-muted-dark">
        <div className="skeleton h-10 w-10 rounded-full" />
        <div className="space-y-1.5">
          <div className="skeleton h-3 w-20" />
          <div className="skeleton h-3 w-14" />
        </div>
      </div>
    );
  }

  if (status === "denied" || status === "error") {
    return (
      <div className="flex items-center gap-2 rounded-2xl bg-white p-4 text-sm text-gray-500 shadow-card dark:bg-muted-dark dark:text-gray-400">
        <FiAlertCircle aria-hidden="true" />
        {status === "denied" ? "Enable location for local weather" : "Weather unavailable"}
      </div>
    );
  }

  const Icon = getWeatherIcon(weather.condition);

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-card dark:bg-muted-dark">
      <Icon size={36} className="shrink-0 text-primary-500" aria-hidden="true" />
      <div>
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <FiMapPin size={12} aria-hidden="true" />
          {weather.city}
          {weather.country ? `, ${weather.country}` : ""}
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl font-bold">{weather.temp}&deg;C</span>
          <span className="text-xs capitalize text-gray-500 dark:text-gray-400">
            {weather.description || weather.condition}
          </span>
        </div>
      </div>
    </div>
  );
}

/** Map an OpenWeatherMap "main" condition string to a weather icon. */
function getWeatherIcon(condition) {
  const map = {
    Clear: WiDaySunny,
    Clouds: WiCloudy,
    Rain: WiRain,
    Drizzle: WiRain,
    Thunderstorm: WiThunderstorm,
    Snow: WiSnow,
    Mist: WiFog,
    Fog: WiFog,
    Haze: WiFog,
  };
  return map[condition] || WiCloud;
}

export default memo(WeatherWidget);
